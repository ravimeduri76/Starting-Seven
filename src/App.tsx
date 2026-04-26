import { useMatch } from './hooks/useMatch';
import { Lobby } from './components/Lobby';
import { Table } from './components/Table';
import { RoundOverMoment } from './components/screens/RoundOverMoment';
import { RoundResults } from './components/screens/RoundResults';
import { MatchResults } from './components/screens/MatchResults';
import { PassDevice } from './components/screens/PassDevice';
import { isMatchOver as checkMatchOver } from './hooks/useMatch';

function App() {
  const match = useMatch();

  switch (match.screen) {
    case 'lobby':
      return (
        <Lobby
          settings={match.settings}
          onSettingsChange={match.setSettings}
          onStartMatch={match.startMatch}
        />
      );

    case 'table':
      if (!match.state || !match.matchConfig) return null;
      return (
        <Table
          state={match.state}
          standings={match.standings}
          matchConfig={match.matchConfig}
          roundNumber={match.roundNumber}
          lastActions={match.lastActions}
          onAction={match.performAction}
        />
      );

    case 'round-over': {
      if (!match.currentRoundResult || !match.matchConfig) return null;
      const winnerPlayer = match.state?.players.find(p => p.id === match.currentRoundResult!.winnerId);
      return (
        <RoundOverMoment
          roundNumber={match.currentRoundResult.roundNumber}
          totalRounds={match.matchConfig.totalRounds}
          winnerName={winnerPlayer?.name ?? 'Unknown'}
          lastCard={match.currentRoundResult.lastCardPlayed}
          onContinue={match.advanceToRoundResults}
        />
      );
    }

    case 'round-results': {
      if (!match.currentRoundResult || !match.matchConfig) return null;
      const matchOver = checkMatchOver(match.roundResults, match.matchConfig);
      return (
        <RoundResults
          roundResult={match.currentRoundResult}
          standings={match.standings}
          matchConfig={match.matchConfig}
          isMatchOver={matchOver}
          onDealNext={match.dealNextRound}
        />
      );
    }

    case 'match-results':
      if (!match.matchConfig) return null;
      return (
        <MatchResults
          standings={match.standings}
          roundResults={match.roundResults}
          matchConfig={match.matchConfig}
          onRematch={match.rematch}
          onBackToLobby={match.backToLobby}
        />
      );

    case 'pass-device': {
      if (!match.state || !match.matchConfig) return null;
      const nextPlayer = match.state.players[match.state.currentSeat];
      const playerStanding = match.standings.find(s => s.playerId === nextPlayer.id);
      return (
        <PassDevice
          nextPlayerName={nextPlayer.name}
          roundNumber={match.roundNumber}
          turnNumber={match.state.turnLog.length + 1}
          playerScore={playerStanding?.totalScore ?? 0}
          playerHandSize={nextPlayer.hand.length}
          onReveal={match.revealHand}
        />
      );
    }
  }
}

export default App;
