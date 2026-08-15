// ==============================================================================
// Biometrics Authentication Service (Fingerprint / Face ID / WebAuthn)
// High Safety International Center - Technical Inspection System
// ==============================================================================

export class BiometricsService {
  /**
   * Check if Biometrics / WebAuthn is supported on this device
   */
  public static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Register Examiner Biometrics (Fingerprint / Face ID)
   */
  public static async registerBiometrics(username: string): Promise<boolean> {
    if (!await this.isAvailable()) {
      throw new Error('البصمة غير مدعومة على هذا الجهاز أو غير مفعلة.');
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(username);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'مركز الأمان العالي الدولي',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: username,
          displayName: `فاحص معتمد (${username})`,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        localStorage.setItem(`hs_biometrics_${username}`, 'enabled');
        localStorage.setItem('hs_last_biometric_user', username);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Biometric registration cancelled or failed:', err);
      throw new Error(err?.message || 'تم إلغاء تفعيل البصمة.');
    }
  }

  /**
   * Authenticate Examiner via Fingerprint / Face ID
   */
  public static async authenticateBiometrics(): Promise<string | null> {
    if (!await this.isAvailable()) {
      throw new Error('البصمة غير متوفرة على هذا الجهاز.');
    }

    const lastUser = localStorage.getItem('hs_last_biometric_user');
    if (!lastUser) {
      throw new Error('لم يتم تسجيل بصمة لهذا الجهاز مسبقاً. يرجى تسجيل الدخول بكلمة المرور أولاً.');
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (assertion) {
        return lastUser;
      }
      return null;
    } catch (err: any) {
      console.warn('Biometric authentication failed:', err);
      throw new Error(err?.message || 'فشلت المطابقة البيومترية.');
    }
  }
}
