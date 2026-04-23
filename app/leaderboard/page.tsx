import { toExplorerAddressUrl } from "@/lib/config/explorer";
import { getLeaderboard } from "@/lib/torque/client";
import { ESCROW_PROGRAM_ID } from "@/lib/program";

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Specialist Leaderboard</h1>
      <p className="text-muted-foreground mb-8">
        Top specialists ranked by completed jobs. Powered by{" "}
        <a href="https://torque.so" target="_blank" rel="noopener noreferrer" className="underline">
          Torque Protocol
        </a>
        .
      </p>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No rankings yet</p>
          <p className="text-sm">Complete jobs as a specialist to appear on the leaderboard.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Rank</th>
                <th className="text-left py-3 px-4 font-semibold">Specialist</th>
                <th className="text-right py-3 px-4 font-semibold">Jobs Completed</th>
                <th className="text-right py-3 px-4 font-semibold">Rewards Earned</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.userPubkey} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-sm">#{entry.rank}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    <a
                      href={toExplorerAddressUrl(entry.userPubkey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {entry.userPubkey.slice(0, 8)}...{entry.userPubkey.slice(-8)}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-right">{entry.value}</td>
                  <td className="py-3 px-4 text-right">{entry.rewards ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-8">
        Rankings update each epoch. Powered by on-chain data from the Reddi Agent Protocol escrow program at{" "}
        <span className="font-mono">{ESCROW_PROGRAM_ID.toBase58()}</span>.
      </p>
    </main>
  );
}

