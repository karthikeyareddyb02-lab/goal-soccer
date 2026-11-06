import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { neon } from '@neondatabase/serverless';

function resultsApi(databaseUrl) {
  return {
    name: 'results-api',
    configureServer(server) {
      server.middlewares.use('/api/results', async (req, res) => {
        const sql = neon(databaseUrl);

        if (req.method === 'GET') {
          const rows = await sql`
            SELECT * FROM results ORDER BY played_at DESC LIMIT 20
          `;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(rows));
          return;
        }

        if (req.method === 'POST') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const rows = await sql`
            INSERT INTO results (
              mode, sub_mode, player_team, opponent_team,
              player_goals, opponent_goals, winner
            )
            VALUES (
              ${body.mode}, ${body.subMode}, ${body.playerTeam}, ${body.opponentTeam},
              ${body.playerGoals}, ${body.opponentGoals}, ${body.winner}
            )
            RETURNING id
          `;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(rows[0]));
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), resultsApi(env.DATABASE_URL)],
    server: { port: 5173 },
  };
});
