import {createWriterProvider} from '../src/pipeline/writer-provider.js';
const type=process.argv[2]||'section_drafting';const provider=createWriterProvider({env:{GENERATION_PROVIDER:'mock'}});console.log(JSON.stringify({ok:true,provider:provider.provider,task_type:type,network_called:false,rule_version:'4.3-document-1'}));
