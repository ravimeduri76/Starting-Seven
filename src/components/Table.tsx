import type { GameState, Action, Card, MatchStandings, MatchConfig, Suit } from '../engine/types';
import { SUITS } from '../engine/types';
import { legalActions } from '../engine/engine';
import { EdCard } from './cards/EdCard';
import { EdChainStrip, ChainRankHeader } from './table/EdChainStrip';
import { EdOpponent } from './table/EdOpponent';
import { Masthead } from './table/Masthead';

interface TableProps {
  state: GameState;
  standings: MatchStandings[];
  matchConfig: MatchConfig;
  roundNumber: number;
  lastActions: Record<string, Action>;
  onAction: (action: Action) => void;
}

export function Table({ state, standings, matchConfig, roundNumber, lastActions, onAction }: TableProps) {
  const currentPlayer = state.players[state.currentSeat];
  const isCurrentBot = currentPlayer.isBot;
  const actions = isCurrentBot ? [] : legalActions(state, currentPlayer.id);

  const playableKeys = new Set(
    actions
      .filter(a => a.type === 'PlayCard')
      .map(a => `${(a as { type: 'PlayCard'; card: Card }).card.rank}${(a as { type: 'PlayCard'; card: Card }).card.suit}`)
  );

  const canOptionalPass = actions.some(a => a.type === 'OptionalPass');
  const isForcedPass = actions.length === 1 && actions[0].type === 'ForcedPass';
  const hasPlayableCards = actions.some(a => a.type === 'PlayCard');

  const holdsASeven = !isCurrentBot && currentPlayer.hand.some(c => c.rank === 7);
  const mustPlayNext = !isCurrentBot && state.mustPlayNext[currentPlayer.id];
  const optionalPassBlocked = hasPlayableCards && !canOptionalPass;
  const blockReason = holdsASeven ? 'You hold a 7' : mustPlayNext ? 'Must play after passing' : '';

  const opponents = state.players.filter(p => p.id !== currentPlayer.id);
  const turnNumber = state.turnLog.length + 1;
  const suitOrder: Suit[] = ['S', 'H', 'D', 'C'];

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        {/* Masthead */}
        <Masthead
          standings={standings}
          matchConfig={matchConfig}
          roundNumber={roundNumber}
          turnNumber={turnNumber}
        />

        {/* Opponents */}
        <div style={{ ...styles.opponentGrid, gridTemplateColumns: `repeat(${opponents.length}, 1fr)` }}>
          {opponents.map(p => (
            <EdOpponent
              key={p.id}
              name={p.name}
              handCount={p.hand.length}
              botDifficulty={p.isBot ? p.botDifficulty : null}
              lastAction={lastActions[p.id]}
              isCurrent={p.seatIndex === state.currentSeat}
            />
          ))}
        </div>

        {/* Chain table */}
        <div style={styles.chainCard}>
          <ChainRankHeader />
          {suitOrder.map(suit => (
            <EdChainStrip
              key={suit}
              suit={suit}
              chain={state.chains[suit]}
              leftovers={state.leftovers}
              ghostChain={state.settings.ghostChain}
            />
          ))}
        </div>

        {/* Turn bar */}
        {!isCurrentBot && (
          <div style={styles.turnBar}>
            <div style={styles.turnLeft}>
              <span style={styles.turnDot} />
              <span style={styles.turnText}>
                {isForcedPass ? 'No playable cards' : 'Your turn — pick a card'}
              </span>
            </div>
            <div style={styles.turnRight}>
              {canOptionalPass && (
                <button style={styles.passBtn} onClick={() => onAction({ type: 'OptionalPass' })}>
                  Optional pass
                </button>
              )}
              {optionalPassBlocked && (
                <button style={styles.passBtnDisabled} disabled title={blockReason}>
                  Optional pass — {blockReason}
                </button>
              )}
              {isForcedPass && (
                <button style={styles.forcedPassBtn} onClick={() => onAction({ type: 'ForcedPass' })} autoFocus>
                  Forced pass
                </button>
              )}
            </div>
          </div>
        )}

        {isCurrentBot && (
          <div style={styles.turnBar}>
            <div style={styles.turnLeft}>
              <span style={{ ...styles.turnDot, animation: 'edPulse 1.5s infinite' }} />
              <span style={styles.turnText}>{currentPlayer.name} is thinking...</span>
            </div>
          </div>
        )}

        {/* Hand */}
        {!isCurrentBot && (
          <div style={styles.handArea}>
            <div style={styles.handLabel}>YOUR HAND</div>
            <div style={styles.hand}>
              {sortHand(currentPlayer.hand).map((card) => {
                const key = `${card.rank}${card.suit}`;
                const isPlayable = playableKeys.has(key);
                return (
                  <EdCard
                    key={key}
                    card={card}
                    size="md"
                    playable={isPlayable}
                    dim={!isPlayable}
                    onClick={isPlayable ? () => onAction({ type: 'PlayCard', card }) : undefined}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<string, number> = { S: 0, H: 1, D: 2, C: 3 };
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return a.rank - b.rank;
  });
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--paper)',
    padding: '0 40px',
  },
  inner: {
    maxWidth: '880px',
    margin: '0 auto',
    paddingBottom: '32px',
  },
  opponentGrid: {
    display: 'grid',
    gap: '10px',
    marginBottom: '12px',
  },
  chainCard: {
    background: 'var(--paper-card)',
    border: '1px solid var(--ink-08)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '12px',
  },
  turnBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'var(--paper-card)',
    border: '1px solid var(--ink-08)',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  turnLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  turnDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    flexShrink: 0,
  },
  turnText: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--ink)',
  },
  turnRight: {},
  passBtn: {
    padding: '8px 16px',
    background: 'var(--ink)',
    color: 'var(--paper)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  passBtnDisabled: {
    padding: '8px 16px',
    background: 'transparent',
    color: 'var(--ink-50)',
    border: '1px solid var(--ink-12)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  forcedPassBtn: {
    padding: '8px 16px',
    background: 'var(--ink-08)',
    color: 'var(--ink-60)',
    border: '1px solid var(--ink-12)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  handArea: {
    background: 'var(--paper-card)',
    border: '1px solid var(--ink-08)',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-lifted)',
  },
  handLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--ink-50)',
    marginBottom: '10px',
  },
  hand: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
};
