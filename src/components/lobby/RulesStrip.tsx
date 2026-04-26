import { useState } from 'react';

export function RulesStrip() {
  const [showFull, setShowFull] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.kicker}>The rules in four moves</div>
      <div style={styles.grid}>
        <RuleCard
          number="1"
          title="Open with a seven"
          body="Any 7 starts its suit's chain. The holder of the 7 of Spades goes first."
        />
        <RuleCard
          number="2"
          title="Extend by one"
          body="Play a card adjacent to either end of an open chain. One card per turn."
        />
        <RuleCard
          number="3"
          title="Pass strategically"
          body="No playable card? Forced pass. Have one but want to wait? Optional pass — but you must play next turn."
        />
        <RuleCard
          number="4"
          title="Lightest hand wins"
          body="First to empty wins the round. Others score the pip value of cards still held (A=1, K=13)."
        />
      </div>

      <button
        style={styles.howToPlay}
        onClick={() => setShowFull(!showFull)}
      >
        {showFull ? 'Hide full rules' : 'How to play — full rules'}
      </button>

      {showFull && (
        <div style={styles.fullRules}>
          <RuleSection title="Setup">
            A standard 52-card deck is dealt equally to 2-6 players. Any leftover cards are placed face-up in the center — they automatically join the chain when the chain reaches them.
          </RuleSection>

          <RuleSection title="Starting">
            The player holding the 7 of Spades goes first by playing it. If the 7 of Spades is a leftover, the holder of the 7 of Hearts starts, and so on.
          </RuleSection>

          <RuleSection title="Playing cards">
            On your turn, play one card that is adjacent (+/- 1 rank) to either end of its suit's chain. Play a 7 to open a new suit. You play exactly one card per turn.
          </RuleSection>

          <RuleSection title="The optional pass">
            <strong>This is the key strategic mechanic.</strong> If you have a playable card but want to hold it, you may take an optional pass. However:
            <ul style={styles.ruleList}>
              <li>After an optional pass, you <strong>must play</strong> on your very next turn — no two passes in a row.</li>
              <li>After playing, you can optional pass again. The rhythm is: pass, play, pass, play.</li>
              <li>There is <strong>no limit</strong> to total optional passes — only the alternating constraint.</li>
              <li>If you hold <strong>any 7</strong>, you cannot optional pass — you must play. This prevents hoarding sevens to block other players.</li>
            </ul>
          </RuleSection>

          <RuleSection title="Forced pass">
            If none of your cards are adjacent to any chain end and you hold no 7s, you are forced to pass. This costs you nothing — it's automatic.
          </RuleSection>

          <RuleSection title="Winning & scoring">
            The round ends immediately when any player empties their hand. That player scores 0. All others score the sum of their remaining card values: Ace = 1, number cards = face value, Jack = 11, Queen = 12, King = 13. Lowest cumulative score across rounds wins the match.
          </RuleSection>

          <RuleSection title="Leftover cards">
            Cards that don't divide evenly are placed face-up. Leftover 7s immediately anchor their suit's chain. Other leftovers auto-join when the chain extends to reach them — this can cascade (multiple leftovers joining at once).
          </RuleSection>
        </div>
      )}
    </div>
  );
}

function RuleCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardNumber}>{number}</div>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardBody}>{body}</div>
    </div>
  );
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.ruleSection}>
      <div style={styles.ruleSectionTitle}>{title}</div>
      <div style={styles.ruleSectionBody}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '2px solid var(--ink)',
    borderBottom: '1px solid var(--ink-12)',
    padding: '24px 0',
    marginBottom: '32px',
  },
  kicker: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-50)',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 32px',
  },
  card: {
    padding: '4px 0',
  },
  cardNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 400,
    color: 'var(--ink)',
    marginBottom: '4px',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--ink)',
    marginBottom: '4px',
  },
  cardBody: {
    fontSize: '13px',
    color: 'var(--ink-60)',
    lineHeight: 1.5,
  },
  howToPlay: {
    marginTop: '20px',
    background: 'none',
    border: 'none',
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
    fontStyle: 'italic',
    color: 'var(--ink-60)',
    cursor: 'pointer',
    padding: '4px 0',
    textDecoration: 'underline',
    textDecorationColor: 'var(--ink-12)',
    textUnderlineOffset: '3px',
  },
  fullRules: {
    marginTop: '20px',
    padding: '24px',
    background: 'var(--paper-card)',
    border: '1px solid var(--ink-08)',
    borderRadius: '8px',
  },
  ruleSection: {
    marginBottom: '16px',
  },
  ruleSectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--ink)',
    marginBottom: '4px',
  },
  ruleSectionBody: {
    fontSize: '13px',
    color: 'var(--ink-60)',
    lineHeight: 1.65,
  },
  ruleList: {
    margin: '8px 0 0',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
};
