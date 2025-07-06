import { getLogs } from './actions';
import { LogsClientPage } from './logs-client-page';

export default async function LogsPage() {
  const logs = await getLogs();
  return <LogsClientPage initialLogs={logs} />;
}
