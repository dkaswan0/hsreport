const fs = require('fs');

function replaceInFile(filePath, search, replace) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content);
}

// pdf-download-modal.tsx
replaceInFile('client/src/components/pdf-download-modal.tsx', /QrCode,\s*/g, '');

// pdf-report-template.tsx
replaceInFile('client/src/components/pdf-report-template.tsx', /const MAIN_SECTIONS_PDF = \[[\s\S]*?\];/g, '');
replaceInFile('client/src/components/pdf-report-template.tsx', /const getCategorySection = [\s\S]*?\}\s*;/g, '');
replaceInFile('client/src/components/pdf-report-template.tsx', /const healthColor =.*?;/g, '');
replaceInFile('client/src/components/pdf-report-template.tsx', /const healthLabel =.*?;/g, '');

// status-badge.tsx
replaceInFile('client/src/components/ui/status-badge.tsx', /type Status = 'pass' \\| 'fail' \\| 'warning' \\| 'pending';/g, '');

// api-keys.tsx
replaceInFile('client/src/pages/api-keys.tsx', /ChevronDown,\s*ChevronUp,\s*/g, '');
replaceInFile('client/src/pages/api-keys.tsx', /Circle,\s*/g, '');

// fault-library.tsx
replaceInFile('client/src/pages/fault-library.tsx', /const CATEGORY_LABELS: Record<string, string> = \{[\s\S]*?\};\n/g, '');
replaceInFile('client/src/pages/fault-library.tsx', /const \{ t \} = useTranslation\(\);\n/g, '');
replaceInFile('client/src/pages/fault-library.tsx', /const categories = Array\.from.*?;\n/g, '');

// inspection-details.tsx
replaceInFile('client/src/pages/inspection-details.tsx', /useFaultSuggestions,\s*/g, '');
replaceInFile('client/src/pages/inspection-details.tsx', /AlertTriangle,\s*/g, '');
replaceInFile('client/src/pages/inspection-details.tsx', /useMutation,\s*/g, '');
replaceInFile('client/src/pages/inspection-details.tsx', /const categoryToArabicFaultLibrary.*?;/g, '');

// interactive-report.tsx
replaceInFile('client/src/pages/interactive-report.tsx', /ShieldCheck,\s*/g, '');
replaceInFile('client/src/pages/interactive-report.tsx', /useCallback,\s*/g, '');
replaceInFile('client/src/pages/interactive-report.tsx', /,\s*CATEGORY_GROUPS\s*/g, '');
replaceInFile('client/src/pages/interactive-report.tsx', /,\s*calculateInspectionStats\s*/g, '');
replaceInFile('client/src/pages/interactive-report.tsx', /const handleDownloadPDF = async \(\) => \{[\s\S]*?\}\s*;/g, '');
replaceInFile('client/src/pages/interactive-report.tsx', /const handleTextPDF = async \(\) => \{[\s\S]*?\}\s*;/g, '');
replaceInFile('client/src/pages/interactive-report.tsx', /const handleDetailedPDF = async \(\) => \{[\s\S]*?\}\s*;/g, '');

// public-report.tsx
replaceInFile('client/src/pages/public-report.tsx', /useEffect,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /Phone,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /User,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /Calendar,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /ShieldCheck,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /Loader2,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /Mail,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /RotateCcw,\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /,\s*calculateInspectionStats\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /,\s*CATEGORY_GROUPS\s*/g, '');
replaceInFile('client/src/pages/public-report.tsx', /const \[introComplete, setIntroComplete\] = useState\(false\);/g, 'const [, setIntroComplete] = useState(false);');
replaceInFile('client/src/pages/public-report.tsx', /const \{ data: status, isLoading: isStatusLoading \} = useQuery\(\{[\s\S]*?\}\);/g, 'const { isLoading: isStatusLoading } = useQuery({ queryKey: [`/api/inspections/public/${token}/status`], queryFn: async () => { const res = await fetch(`/api/inspections/public/${token}/status`); return res.json(); }, refetchInterval: 10000 });');

// server/routes.ts
replaceInFile('server/routes.ts', /const requireAuthOrApiKey = async \(req: Request, res: Response, next: NextFunction\) => \{[\s\S]*?\}\s*;/g, '');
replaceInFile('server/routes.ts', /\(req, res\)/g, '(_req, res)'); // general safety for req

// server/services/image-analysis.ts
replaceInFile('server/services/image-analysis.ts', /,\s*Buffer/g, '');

// server/storage.ts
replaceInFile('server/storage.ts', /status:\s*string/g, '');

console.log('Fixed unused variables.');
