/** The executive dossier: six zero-scroll pages of plain-english context. */
export interface DossierBlock {
  head: string;
  body: string;
}

export interface DossierPage {
  id: string;
  index: string;
  label: string;
  /** cyan section label above the page */
  section: string;
}

export const DOSSIER_PAGES: DossierPage[] = [
  { id: 'hook', index: '01', label: 'hook', section: '01 / the executive hook' },
  { id: 'services', index: '02', label: 'services', section: '02 / what we offer your team' },
  { id: 'economics', index: '03', label: 'economics', section: '03 / the pay-as-you-get manifesto' },
  { id: 'sovereignty', index: '04', label: 'sovereignty', section: '04 / the shadow perimeter' },
  { id: 'partnership', index: '05', label: 'partnership', section: '05 / the three-step engagement' },
  { id: 'verification', index: '06', label: 'verification', section: '06 / transition to verification' },
];

export const HOOK = {
  headline: 'stop bleeding cloud capital. start autonomous engineering.',
  proposition:
    'we are an elite, embedded research and execution task force. we deploy directly onto your existing hardware to rewrite legacy bottlenecks — with zero upfront capital and zero data exfiltration.',
  bottomLine:
    'you only pay a fractional efficiency royalty on the exact operational cash we mathematically prove we save you.',
  ctaExplore: 'explore our offerings',
  ctaSimulate: 'simulate your financial savings',
};

export const SERVICES = [
  {
    id: 'refactoring',
    title: '[+] deep-stack application refactoring',
    body: 'we surgically convert slow, single-tenant legacy monoliths into scalable, multi-tenant architectures without disrupting daily business operations.',
  },
  {
    id: 'scaling',
    title: '[+] bare-metal data scaling',
    body: 'we replace choking database layers with hardware-native, zero-allocation engines that handle massive parallel workloads (such as 2 million record inserts per partition) while radically shrinking your monthly cloud compute bill.',
  },
  {
    id: 'pipelines',
    title: '[+] autonomous ai product pipelines',
    body: 'we embed living intelligence into your organization. our multi-agent workflows ingest raw business requirements and autonomously generate production-ready code, collapsing your development cycles from months into days.',
  },
];

export const ECONOMICS: DossierBlock[] = [
  {
    head: 'zero upfront retainers',
    body: 'abandon traditional consulting traps. there are no software licensing fees, no hourly retainers, and no upfront financial commitments.',
  },
  {
    head: 'performance-tethered invoicing',
    body: 'our systems cryptographically measure the exact operational cash and compute overhead we destroy every month. we take a fractional efficiency royalty strictly from the net savings generated. if we prove no savings, you pay nothing.',
  },
];

export const SOVEREIGNTY: DossierBlock[] = [
  {
    head: 'local iron deployment',
    body: 'our agents and optimization engines operate entirely within your private cloud or company servers.',
  },
  {
    head: 'zero data exfiltration',
    body: 'your proprietary corporate data, client records, and source code never touch external public clouds. absolute infosec and regulatory compliance are built into the architecture.',
  },
];

export const PARTNERSHIP: DossierBlock[] = [
  {
    head: 'step 1 / the shadow audit',
    body: 'our diagnostic tools run locally to map your performance bottlenecks and calculate your exact cloud wastage.',
  },
  {
    head: 'step 2 / the local overhaul',
    body: 'our autonomous task force executes the code rewrites and database redesigns directly on your infrastructure.',
  },
  {
    head: 'step 3 / the value-delta return',
    body: 'you review the verified efficiency gains, reduced latency, and retained capital before any royalty calculation takes place.',
  },
];

export const VERIFICATION = {
  head: 'the proof point',
  body: 'a live, interactive calculator where you input your current monthly cloud spend and data ingestion volume to instantly verify your projected net retained capital.',
  cta: 'launch value-delta simulator',
};
