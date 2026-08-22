import { useState, useEffect } from 'react';
import { CHALLENGES, CURSES, SPECIAL_CARDS, Card } from '../data/challenges';
import { getActiveProfile, saveActiveGameState } from '../data/profiles';
import type { Fahrkarte, GameState, HistoryCard } from '../data/profiles';

const TIMER_DURATION = 3600;
const BLESSING_TIMER_DURATION = 10 * 60;
const FAHRKARTE_OPTIONS = [
  { cost: 10, stops: 5, durationSeconds: 20 * 60 },
  { cost: 30, stops: 20, durationSeconds: 60 * 60 },
] as const;

export default function ChallengeSelector() {
  const [drawnCards, setDrawnCards] = useState<Card[] | null>(null);
  const [cardTimestamps, setCardTimestamps] = useState<Record<number, number>>({});
  const [tickCount, setTickCount] = useState(0);
  const [history, setHistory] = useState<HistoryCard[]>([]);
  const [coinEdits, setCoinEdits] = useState<
    { timestamp: string; previousAmount: number; newAmount: number; comment: string }[]
  >([]);
  const [activeCurse, setActiveCurse] = useState<Card | null>(null);
  const [curseTimestamp, setCurseTimestamp] = useState<number | null>(null);
  const [activeBlessing, setActiveBlessing] = useState<Card | null>(null);
  const [blessingTimestamp, setBlessingTimestamp] = useState<number | null>(null);
  const [failedBackgroundImages, setFailedBackgroundImages] = useState<Set<number>>(new Set());
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [lastCurseTime, setLastCurseTime] = useState<number | null>(null);
  const [coins, setCoins] = useState(0);
  const [activeFahrkarte, setActiveFahrkarte] = useState<Fahrkarte | null>(null);
  const [activeFreeFahrkarte, setActiveFreeFahrkarte] = useState<Fahrkarte | null>(null);
  const [fahrkartenHistory, setFahrkartenHistory] = useState<Fahrkarte[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    const loaded = loadFromStorage();
    if (!loaded) {
      drawInitialCards();
    }
  }, []);

  useEffect(() => {
    if (
      (!drawnCards || drawnCards.length === 0) &&
      !activeCurse &&
      !activeBlessing &&
      !activeFahrkarte &&
      !activeFreeFahrkarte
    )
      return;

    const interval = setInterval(() => {
      setTickCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [drawnCards, activeCurse, activeBlessing, activeFahrkarte, activeFreeFahrkarte]);

  useEffect(() => {
    discardExpiredCards();
    expireFahrkarten();
  }, [tickCount]);

  const loadFromStorage = (): boolean => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return false;

    const state = activeProfile.state;
    setDrawnCards(state.drawnCards);
    setCardTimestamps(state.cardTimestamps || {});
    setHistory(state.history || []);
    setCoinEdits(state.coinEdits || []);
    setActiveCurse(state.activeCurse || null);
    setCurseTimestamp(state.curseTimestamp ?? null);
    setActiveBlessing(state.activeBlessing || null);
    setBlessingTimestamp(state.blessingTimestamp ?? null);
    setGameStartTime(state.gameStartTime ?? null);
    setLastCurseTime(state.lastCurseTime ?? null);
    setCoins(state.coins ?? 0);
    setFahrkartenHistory(state.fahrkartenHistory || []);

    const savedFahrkarte = state.activeFahrkarte || null;
    const savedFreeFahrkarte = state.activeFreeFahrkarte || null;
    const paidFahrkarte =
      savedFahrkarte && savedFahrkarte.expiresAt > Date.now() ? savedFahrkarte : null;
    const freeFahrkarte =
      savedFreeFahrkarte && savedFreeFahrkarte.expiresAt > Date.now() ? savedFreeFahrkarte : null;
    setActiveFahrkarte(paidFahrkarte);
    setActiveFreeFahrkarte(freeFahrkarte);
    if (paidFahrkarte !== savedFahrkarte || freeFahrkarte !== savedFreeFahrkarte) {
      saveActiveGameState({
        ...state,
        activeFahrkarte: paidFahrkarte,
        activeFreeFahrkarte: freeFahrkarte,
        fahrkartenHistory: state.fahrkartenHistory || [],
      });
    }
    return state.drawnCards !== null;
  };

  const getCurseProbability = (referenceTime: number): number => {
    const timeReference = lastCurseTime || referenceTime;
    const elapsedMs = Date.now() - timeReference;
    const elapsedMins = elapsedMs / 60000;

    if (elapsedMins >= 120) return 0.9;
    if (elapsedMins <= 0) return 0.1;

    return 0.1 + (elapsedMins / 120) * 0.8;
  };

  const shouldDrawCurse = (referenceTime: number): boolean => {
    const probability = getCurseProbability(referenceTime);
    return Math.random() < probability;
  };

  const getUsedCardIds = (
    cards: Card[] | null,
    hist: HistoryCard[],
    curse: Card | null,
    blessing: Card | null = activeBlessing,
  ): Set<number> => {
    return new Set(
      [...(cards || []), ...hist, ...(curse ? [curse] : []), ...(blessing ? [blessing] : [])].map(
        (card) => card.id,
      ),
    );
  };

  const drawCurseCard = (usedCardIds: Set<number>): Card | null => {
    const availableCurses = CURSES.filter((curse) => !usedCardIds.has(curse.id));
    if (availableCurses.length === 0) return null;
    return availableCurses[Math.floor(Math.random() * availableCurses.length)];
  };

  const drawBlessingCard = (usedCardIds: Set<number>): Card | null => {
    const availableBlessings = SPECIAL_CARDS.filter((blessing) => !usedCardIds.has(blessing.id));
    if (availableBlessings.length === 0) return null;
    return availableBlessings[Math.floor(Math.random() * availableBlessings.length)];
  };

  const drawEffectCard = (
    usedCardIds: Set<number>,
  ): { card?: Card; type: 'curse' | 'blessing' | 'freeFahrkarte' } | null => {
    const curse = drawCurseCard(usedCardIds);
    const blessing = drawBlessingCard(usedCardIds);
    const available = [
      ...(curse ? [{ card: curse, type: 'curse' as const }] : []),
      ...(blessing ? [{ card: blessing, type: 'blessing' as const }] : []),
      { type: 'freeFahrkarte' as const },
    ];
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };

  const createFreeFahrkarte = (now: number): Fahrkarte => {
    const startsAt = activeFahrkarte?.expiresAt || now;
    return {
      id: `free-fahrkarte-${now}-${Math.random().toString(36).slice(2, 8)}`,
      cost: 0,
      stops: 0,
      durationSeconds: 15 * 60,
      purchasedAt: new Date(now).toISOString(),
      startsAt,
      expiresAt: startsAt + 15 * 60 * 1000,
      isFree: true,
    };
  };

  const drawInitialCards = (): void => {
    const now = Date.now();
    const drawn = getRandomCards(CHALLENGES);
    const newTimestamps: Record<number, number> = {};
    drawn.forEach((card) => {
      newTimestamps[card.id] = now;
    });

    let curse: Card | null = null;
    let curseTs: number | null = null;
    let blessing: Card | null = null;
    let blessingTs: number | null = null;
    let freeFahrkarte: Fahrkarte | null = null;
    if (shouldDrawCurse(now)) {
      const effect = drawEffectCard(getUsedCardIds(drawn, [], null, null));
      if (effect?.type === 'blessing' && effect.card) {
        blessing = effect.card;
        blessingTs = now;
      } else if (effect?.type === 'curse' && effect.card) {
        curse = effect.card;
        curseTs = now;
      } else if (effect?.type === 'freeFahrkarte') {
        freeFahrkarte = createFreeFahrkarte(now);
      }
    }

    setGameStartTime(now);
    setLastCurseTime(now);
    setDrawnCards(drawn);
    setCardTimestamps(newTimestamps);
    setHistory([]);
    setCoinEdits([]);
    setActiveCurse(curse);
    setCurseTimestamp(curseTs);
    setActiveBlessing(blessing);
    setBlessingTimestamp(blessingTs);
    setCoins(20);
    setActiveFahrkarte(null);
    setActiveFreeFahrkarte(freeFahrkarte);
    const initialFahrkartenHistory = freeFahrkarte ? [freeFahrkarte] : [];
    setFahrkartenHistory(initialFahrkartenHistory);
    saveToStorage(
      drawn,
      newTimestamps,
      [],
      curse,
      curseTs,
      now,
      now,
      20,
      [],
      null,
      initialFahrkartenHistory,
      blessing,
      blessingTs,
      freeFahrkarte,
    );
  };

  const drawReplacementCard = (
    cards: Card[],
    timestamps: Record<number, number>,
    hist: HistoryCard[],
    coinsValue: number = coins,
  ): void => {
    const replacement = getRandomCards(
      CHALLENGES,
      getUsedCardIds(cards, hist, activeCurse, activeBlessing),
    )[0];
    const now = Date.now();
    const newCards = replacement ? [...cards, replacement] : cards;
    const newTimestamps = { ...timestamps };
    if (replacement) {
      newTimestamps[replacement.id] = now;
    }

    let curse: Card | null = activeCurse;
    let curseTs: number | null = curseTimestamp;
    let blessing: Card | null = activeBlessing;
    let blessingTs: number | null = blessingTimestamp;
    let freeFahrkarte: Fahrkarte | null = activeFreeFahrkarte;
    let newFahrkartenHistory = fahrkartenHistory;
    let lastCurse: number | null = lastCurseTime;

    if (
      !activeCurse &&
      !activeBlessing &&
      !activeFreeFahrkarte &&
      shouldDrawCurse(lastCurseTime || gameStartTime || now)
    ) {
      const effect = drawEffectCard(getUsedCardIds(newCards, hist, null, null));
      if (effect?.type === 'blessing' && effect.card) {
        blessing = effect.card;
        blessingTs = now;
      } else if (effect?.type === 'curse' && effect.card) {
        curse = effect.card;
        curseTs = now;
        lastCurse = lastCurseTime;
      } else if (effect?.type === 'freeFahrkarte') {
        freeFahrkarte = createFreeFahrkarte(now);
        newFahrkartenHistory = [freeFahrkarte, ...fahrkartenHistory];
      }
    }

    setDrawnCards(newCards);
    setCardTimestamps(newTimestamps);
    setActiveCurse(curse);
    setCurseTimestamp(curseTs);
    setActiveBlessing(blessing);
    setBlessingTimestamp(blessingTs);
    setActiveFreeFahrkarte(freeFahrkarte);
    setFahrkartenHistory(newFahrkartenHistory);
    saveToStorage(
      newCards,
      newTimestamps,
      hist,
      curse,
      curseTs,
      gameStartTime,
      lastCurse,
      coinsValue,
      coinEdits,
      activeFahrkarte,
      newFahrkartenHistory,
      blessing,
      blessingTs,
      freeFahrkarte,
    );
  };

  const saveToStorage = (
    cards: Card[] | null,
    timestamps: Record<number, number>,
    hist: HistoryCard[],
    curse: Card | null = null,
    curseTs: number | null = null,
    startTime: number | null = null,
    lastCurseTs: number | null = null,
    coinsValue: number = coins,
    edits: {
      timestamp: string;
      previousAmount: number;
      newAmount: number;
      comment: string;
    }[] = coinEdits,
    fahrkarte: Fahrkarte | null = activeFahrkarte,
    fahrkartenHist: Fahrkarte[] = fahrkartenHistory,
    blessing: Card | null = activeBlessing,
    blessingTs: number | null = blessingTimestamp,
    freeFahrkarte: Fahrkarte | null = activeFreeFahrkarte,
  ): void => {
    const state: GameState = {
      drawnCards: cards,
      cardTimestamps: timestamps,
      history: hist,
      coinEdits: edits,
      activeCurse: curse,
      curseTimestamp: curseTs,
      activeBlessing: blessing,
      blessingTimestamp: blessingTs,
      gameStartTime: startTime,
      lastCurseTime: lastCurseTs,
      coins: coinsValue,
      activeFahrkarte: fahrkarte,
      activeFreeFahrkarte: freeFahrkarte,
      fahrkartenHistory: fahrkartenHist,
    };
    saveActiveGameState(state);
  };

  const getRandomCards = (cards: Card[], usedCardIds: Set<number> = new Set()): Card[] => {
    const availableCards = cards.filter((card) => !usedCardIds.has(card.id));
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  };

  const getTimeRemaining = (cardId: number): number => {
    if (!cardTimestamps[cardId]) return TIMER_DURATION;
    const elapsed = Math.floor((Date.now() - cardTimestamps[cardId]) / 1000);
    return Math.max(0, TIMER_DURATION - elapsed);
  };

  const getTimeRemainingForCurse = (): number => {
    if (!curseTimestamp || !activeCurse) return TIMER_DURATION;
    const curseDuration = activeCurse.timerSeconds || TIMER_DURATION;
    const elapsed = Math.floor((Date.now() - curseTimestamp) / 1000);
    return Math.max(0, curseDuration - elapsed);
  };

  const getTimeRemainingForBlessing = (): number => {
    if (!blessingTimestamp || !activeBlessing) return BLESSING_TIMER_DURATION;
    const blessingDuration = activeBlessing.timerSeconds || BLESSING_TIMER_DURATION;
    const elapsed = Math.floor((Date.now() - blessingTimestamp) / 1000);
    return Math.max(0, blessingDuration - elapsed);
  };

  const handleCompleteCurse = (): void => {
    const completedCurse = activeCurse;
    const timeLeftWhenCompleted = getTimeRemainingForCurse();
    const newHistory = [
      {
        ...completedCurse,
        completedAt: new Date().toLocaleString(),
        timeLeftWhenCompleted,
        isCurse: true,
        status: 'completed',
      } as HistoryCard,
      ...history,
    ];

    const now = Date.now();
    setActiveCurse(null);
    setCurseTimestamp(null);
    setLastCurseTime(now);
    setHistory(newHistory);
    saveToStorage(drawnCards, cardTimestamps, newHistory, null, null, gameStartTime, now, coins);
  };

  const handleCompleteBlessing = (): void => {
    if (!activeBlessing) return;

    const completedBlessing = activeBlessing;
    const timeLeftWhenCompleted = getTimeRemainingForBlessing();
    const newHistory = [
      {
        ...completedBlessing,
        completedAt: new Date().toLocaleString(),
        timeLeftWhenCompleted,
        isCurse: false,
        status: 'completed',
      } as HistoryCard,
      ...history,
    ];
    const newCoins = coins + (completedBlessing.points || 0);

    setActiveBlessing(null);
    setBlessingTimestamp(null);
    setHistory(newHistory);
    setCoins(newCoins);
    saveToStorage(
      drawnCards,
      cardTimestamps,
      newHistory,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      newCoins,
      coinEdits,
      activeFahrkarte,
      fahrkartenHistory,
      null,
      null,
    );
  };

  const handleCompleteCard = (cardId: number): void => {
    const completedCard = drawnCards?.find((c) => c.id === cardId);
    if (!completedCard) return;

    const timeLeftWhenCompleted = getTimeRemaining(cardId);
    if (timeLeftWhenCompleted === 0) {
      discardExpiredCards([cardId]);
      return;
    }

    const newHistory = [
      {
        ...completedCard,
        completedAt: new Date().toLocaleString(),
        timeLeftWhenCompleted,
        isCurse: false,
        status: 'completed',
      } as HistoryCard,
      ...history,
    ];

    const remaining = drawnCards?.filter((c) => c.id !== cardId) || [];
    const newTimestamps = { ...cardTimestamps };
    delete newTimestamps[cardId];

    const earnedCoins = completedCard.points || 0;
    const newCoins = coins + earnedCoins;
    setCoins(newCoins);

    setHistory(newHistory);
    drawReplacementCard(remaining, newTimestamps, newHistory, newCoins);
  };

  const discardExpiredCards = (cardIds?: number[]): void => {
    if (!drawnCards?.length) return;

    const expiredCards = drawnCards.filter((card) => {
      const isSelected = !cardIds || cardIds.includes(card.id);
      return isSelected && getTimeRemaining(card.id) === 0;
    });
    if (expiredCards.length === 0) return;

    const expiredIds = new Set(expiredCards.map((card) => card.id));
    const now = Date.now();
    const newHistory: HistoryCard[] = [
      ...expiredCards.map((card) => ({
        ...card,
        points: 0,
        completedAt: new Date().toLocaleString(),
        timeLeftWhenCompleted: 0,
        isCurse: false,
        status: 'expired' as const,
      })),
      ...history,
    ];
    const newTimestamps = { ...cardTimestamps };
    expiredIds.forEach((id) => delete newTimestamps[id]);

    const newCards = drawnCards.filter((card) => !expiredIds.has(card.id));
    const usedCardIds = getUsedCardIds(newCards, newHistory, activeCurse, activeBlessing);
    expiredCards.forEach(() => {
      const replacement = getRandomCards(CHALLENGES, usedCardIds)[0];
      if (!replacement) return;

      newCards.push(replacement);
      newTimestamps[replacement.id] = now;
      usedCardIds.add(replacement.id);
    });

    setDrawnCards(newCards);
    setCardTimestamps(newTimestamps);
    setHistory(newHistory);
    saveToStorage(
      newCards,
      newTimestamps,
      newHistory,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      coins,
    );
  };

  const isSpecialCard = (card: Card): boolean =>
    SPECIAL_CARDS.some((specialCard) => specialCard.id === card.id);
  const isCurseCard = (card: Card): boolean => CURSES.some((curse) => curse.id === card.id);
  const isChallengeCard = (card: Card): boolean =>
    CHALLENGES.some((challenge) => challenge.id === card.id);

  const getCategoryColor = (card: Card): string => {
    if (isSpecialCard(card)) return 'from-purple-500 to-pink-500';
    if (isCurseCard(card)) return 'from-red-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getCategoryLabel = (card: Card): string => {
    if (isSpecialCard(card)) return 'SPECIAL CARD';
    if (isCurseCard(card)) return 'CURSE';
    return 'CHALLENGE';
  };

  const getBackgroundImage = (card: Card): string | undefined => {
    if (card.backgroundImage) return card.backgroundImage;
    if (isChallengeCard(card)) return `/challenges/${card.id}.jpg`;
    return undefined;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFahrkarteTimeRemaining = (): number => {
    if (!activeFahrkarte) return 0;
    return Math.max(0, Math.ceil((activeFahrkarte.expiresAt - Date.now()) / 1000));
  };

  const getFreeFahrkarteTimeRemaining = (): number => {
    if (!activeFreeFahrkarte || Date.now() < (activeFreeFahrkarte.startsAt || 0)) return 0;
    return Math.max(0, Math.ceil((activeFreeFahrkarte.expiresAt - Date.now()) / 1000));
  };

  const getFreeFahrkarteStartsIn = (): number => {
    if (!activeFreeFahrkarte) return 0;
    return Math.max(0, Math.ceil(((activeFreeFahrkarte.startsAt || 0) - Date.now()) / 1000));
  };

  const expireFahrkarten = (): void => {
    const paidExpired = activeFahrkarte && getFahrkarteTimeRemaining() === 0;
    const freeExpired =
      activeFreeFahrkarte &&
      getFreeFahrkarteTimeRemaining() === 0 &&
      getFreeFahrkarteStartsIn() === 0;
    if (!paidExpired && !freeExpired) return;

    const newPaidFahrkarte = paidExpired ? null : activeFahrkarte;
    const newFreeFahrkarte = freeExpired ? null : activeFreeFahrkarte;
    setActiveFahrkarte(newPaidFahrkarte);
    setActiveFreeFahrkarte(newFreeFahrkarte);
    saveToStorage(
      drawnCards,
      cardTimestamps,
      history,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      coins,
      coinEdits,
      newPaidFahrkarte,
      fahrkartenHistory,
      activeBlessing,
      blessingTimestamp,
      newFreeFahrkarte,
    );
  };

  const handleFinishFahrkarte = (): void => {
    if (!activeFahrkarte || getFahrkarteTimeRemaining() === 0) return;
    if (!window.confirm('Finish this Fahrkarte?')) return;

    const finishedFahrkarte = {
      ...activeFahrkarte,
      finishedAt: new Date().toISOString(),
    };
    const now = Date.now();
    const activatedFreeFahrkarte =
      activeFreeFahrkarte && (activeFreeFahrkarte.startsAt || 0) > now
        ? {
            ...activeFreeFahrkarte,
            startsAt: now,
            expiresAt: now + activeFreeFahrkarte.durationSeconds * 1000,
          }
        : activeFreeFahrkarte;
    const newHistory = fahrkartenHistory.map((fahrkarte) =>
      fahrkarte.id === finishedFahrkarte.id
        ? finishedFahrkarte
        : fahrkarte.id === activatedFreeFahrkarte?.id
          ? activatedFreeFahrkarte
          : fahrkarte,
    );

    setActiveFahrkarte(null);
    setActiveFreeFahrkarte(activatedFreeFahrkarte);
    setFahrkartenHistory(newHistory);
    saveToStorage(
      drawnCards,
      cardTimestamps,
      history,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      coins,
      coinEdits,
      null,
      newHistory,
      activeBlessing,
      blessingTimestamp,
      activatedFreeFahrkarte,
    );
  };

  const handleFinishFreeFahrkarte = (): void => {
    if (!activeFreeFahrkarte || getFreeFahrkarteTimeRemaining() === 0) return;
    if (!window.confirm('Finish this free Fahrkarte?')) return;

    const finishedFahrkarte = {
      ...activeFreeFahrkarte,
      finishedAt: new Date().toISOString(),
    };
    const newHistory = fahrkartenHistory.map((fahrkarte) =>
      fahrkarte.id === finishedFahrkarte.id ? finishedFahrkarte : fahrkarte,
    );

    setActiveFreeFahrkarte(null);
    setFahrkartenHistory(newHistory);
    saveToStorage(
      drawnCards,
      cardTimestamps,
      history,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      coins,
      coinEdits,
      activeFahrkarte,
      newHistory,
      activeBlessing,
      blessingTimestamp,
      null,
    );
  };

  const handleBuyFahrkarte = (option: (typeof FAHRKARTE_OPTIONS)[number]): void => {
    if (activeFahrkarte || activeFreeFahrkarte || coins < option.cost) return;

    const now = Date.now();
    const newFahrkarte: Fahrkarte = {
      id: `fahrkarte-${now}-${Math.random().toString(36).slice(2, 8)}`,
      cost: option.cost,
      stops: option.stops,
      durationSeconds: option.durationSeconds,
      purchasedAt: new Date(now).toISOString(),
      expiresAt: now + option.durationSeconds * 1000,
    };
    const newCoins = coins - option.cost;
    const newHistory = [newFahrkarte, ...fahrkartenHistory];

    setCoins(newCoins);
    setActiveFahrkarte(newFahrkarte);
    setFahrkartenHistory(newHistory);
    saveToStorage(
      drawnCards,
      cardTimestamps,
      history,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      newCoins,
      coinEdits,
      newFahrkarte,
      newHistory,
      activeBlessing,
      blessingTimestamp,
      activeFreeFahrkarte,
    );
  };

  const handleSaveCoinEdit = (): void => {
    if (!editAmount || !editComment.trim()) {
      alert('Please enter both an amount and a comment');
      return;
    }

    const newAmount = parseInt(editAmount, 10);
    if (isNaN(newAmount)) {
      alert('Please enter a valid number');
      return;
    }

    if (!window.confirm(`Change coins from ${coins} to ${newAmount}?`)) return;

    const newEdit = {
      timestamp: new Date().toLocaleString(),
      previousAmount: coins,
      newAmount,
      comment: editComment.trim(),
    };

    const newEdits = [newEdit, ...coinEdits];
    setCoins(newAmount);
    setCoinEdits(newEdits);
    saveToStorage(
      drawnCards,
      cardTimestamps,
      history,
      activeCurse,
      curseTimestamp,
      gameStartTime,
      lastCurseTime,
      newAmount,
      newEdits,
    );
    setShowEditModal(false);
    setEditAmount('');
    setEditComment('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 text-center shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm font-bold text-gray-800 opacity-90">COINS</div>
          <div className="text-4xl font-bold text-gray-900 mt-1">💰 {coins}</div>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded transition text-sm"
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Coins</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Amount</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder={coins.toString()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment (required)
                </label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Why are you changing this?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditAmount('');
                    setEditComment('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCoinEdit}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {activeFahrkarte ? (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-8 text-white shadow-2xl flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold opacity-90 uppercase">🚇 FAHRKARTE</div>
                <h2 className="text-3xl font-bold mt-2">Public transport access</h2>
              </div>
              <div
                className={`text-right text-2xl font-bold ${getFahrkarteTimeRemaining() < 300 ? 'animate-pulse' : ''}`}
              >
                {formatTime(getFahrkarteTimeRemaining())}
              </div>
            </div>
            <p className="text-lg leading-relaxed mt-4">
              {activeFahrkarte.stops} stops · valid for{' '}
              {Math.round(activeFahrkarte.durationSeconds / 60)} minutes
            </p>
            <button
              onClick={handleFinishFahrkarte}
              className="mt-6 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-3 px-4 rounded-lg transition border border-white border-opacity-30"
            >
              ✓ Finish Fahrkarte
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-3 text-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAHRKARTE_OPTIONS.map((option) => {
                const cannotAfford = coins < option.cost;
                const unavailable = cannotAfford || Boolean(activeFreeFahrkarte);
                return (
                  <button
                    key={option.cost}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Spend ${option.cost} coins for ${option.stops} stops and ${Math.round(option.durationSeconds / 60)} minutes?`,
                        )
                      ) {
                        handleBuyFahrkarte(option);
                      }
                    }}
                    disabled={unavailable}
                    className={`rounded-lg border-2 px-4 py-3 text-left transition ${unavailable ? 'cursor-not-allowed border-white border-opacity-20 bg-white bg-opacity-10 text-white text-opacity-50' : 'border-white border-opacity-40 bg-white bg-opacity-15 hover:bg-opacity-25'}`}
                  >
                    <div className="font-bold">🚇 FAHRKARTE</div>
                    <div className="font-bold">
                      {option.stops} stops · {Math.round(option.durationSeconds / 60)} minutes
                    </div>
                    <div className="text-sm mt-1">
                      💰 {option.cost} coins
                      {cannotAfford
                        ? ' · Not enough coins'
                        : activeFreeFahrkarte
                          ? ' · Free Fahrkarte active'
                          : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeFreeFahrkarte && (
        <div className="bg-gradient-to-r from-indigo-700 to-violet-600 rounded-xl p-8 text-white shadow-2xl flex flex-col border-2 border-violet-300">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-bold opacity-90 uppercase">🎫 FREE FAHRKARTE</div>
              <h2 className="text-3xl font-bold mt-2">Free public transport access</h2>
            </div>
            <div
              className={`text-right text-2xl font-bold ${getFreeFahrkarteStartsIn() === 0 && getFreeFahrkarteTimeRemaining() < 300 ? 'animate-pulse' : ''}`}
            >
              {getFreeFahrkarteStartsIn() > 0
                ? `Starts in ${formatTime(getFreeFahrkarteStartsIn())}`
                : formatTime(getFreeFahrkarteTimeRemaining())}
            </div>
          </div>
          <p className="text-lg leading-relaxed mt-4">Free travel · valid for 15 minutes</p>
          <button
            onClick={handleFinishFreeFahrkarte}
            disabled={getFreeFahrkarteStartsIn() > 0}
            className="mt-6 w-full bg-white bg-opacity-20 hover:bg-opacity-30 disabled:cursor-not-allowed disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition border border-white border-opacity-30"
          >
            ✓ Finish Free Fahrkarte
          </button>
        </div>
      )}

      {activeBlessing && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 border-purple-700 rounded-xl p-8 text-white shadow-2xl flex flex-col border-2">
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold opacity-90 uppercase">
                  ✨ BLESSING #{activeBlessing.id}
                </div>
                <h2 className="text-3xl font-bold mt-2">{activeBlessing.title}</h2>
              </div>
              <div
                className={`text-right text-2xl font-bold ${getTimeRemainingForBlessing() < 300 ? 'animate-pulse' : ''}`}
              >
                {formatTime(getTimeRemainingForBlessing())}
              </div>
            </div>
            <p className="text-lg leading-relaxed opacity-95">{activeBlessing.description}</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Finish “${activeBlessing.title}”?`)) handleCompleteBlessing();
            }}
            className="mt-6 w-full bg-white bg-opacity-20 hover:bg-opacity-30 disabled:cursor-not-allowed disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition border border-white border-opacity-30"
          >
            ✓ Complete Blessing
          </button>
        </div>
      )}

      {activeCurse && (
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl p-8 text-white shadow-2xl flex flex-col border-2 border-red-700">
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold opacity-90 uppercase">
                  ⚠ CURSE #{activeCurse.id}
                </div>
                <h2 className="text-3xl font-bold mt-2">{activeCurse.title}</h2>
              </div>
              <div
                className={`text-right text-2xl font-bold ${getTimeRemainingForCurse() < 300 ? 'animate-pulse' : ''}`}
              >
                {formatTime(getTimeRemainingForCurse())}
              </div>
            </div>
            <p className="text-lg leading-relaxed opacity-95">{activeCurse.description}</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Mark “${activeCurse.title}” as completed?`))
                handleCompleteCurse();
            }}
            className="mt-6 w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition border-2 border-red-400"
          >
            ✓ Complete Curse
          </button>
        </div>
      )}

      {drawnCards && (
        <div
          className={`grid gap-6 ${drawnCards.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}
        >
          {drawnCards.map((card) => {
            const timeRemaining = getTimeRemaining(card.id);
            const backgroundImage = getBackgroundImage(card);
            const imageFailed = failedBackgroundImages.has(card.id);
            return (
              <div
                key={card.id}
                className={`${imageFailed ? 'bg-slate-800' : `bg-gradient-to-r ${getCategoryColor(card)}`} relative overflow-hidden rounded-xl p-8 text-white shadow-2xl flex flex-col`}
              >
                {backgroundImage && !imageFailed && (
                  <>
                    <img
                      src={backgroundImage}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={() =>
                        setFailedBackgroundImages((failed) => new Set(failed).add(card.id))
                      }
                    />
                    <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />
                  </>
                )}
                <div className="relative z-10 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold opacity-90">
                        {getCategoryLabel(card)} #{card.id}
                      </div>
                      <h2 className="text-3xl font-bold mt-2">{card.title}</h2>
                    </div>
                    <div
                      className={`text-right text-2xl font-bold ${timeRemaining < 300 ? 'animate-pulse' : ''}`}
                    >
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed opacity-95">{card.description}</p>
                  {card.points !== null && (
                    <div className="pt-4 border-t border-white border-opacity-30">
                      <span className="text-2xl font-bold">+{card.points} pts</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Mark “${card.title}” as completed?`))
                      handleCompleteCard(card.id);
                  }}
                  disabled={(activeCurse && activeCurse.isBlocking) || timeRemaining === 0}
                  className={`relative z-10 mt-6 w-full font-bold py-3 px-4 rounded-lg transition border ${
                    (activeCurse && activeCurse.isBlocking) || timeRemaining === 0
                      ? 'bg-white bg-opacity-10 text-white text-opacity-50 border-white border-opacity-10 cursor-not-allowed'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30'
                  }`}
                >
                  {timeRemaining === 0
                    ? 'Expired'
                    : activeCurse && activeCurse.isBlocking
                      ? '🔒 Blocked by curse'
                      : '✓ Complete'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Challenge History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((card, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm border-l-4 ${
                  card.isCurse
                    ? 'bg-red-50 text-gray-700 border-red-500'
                    : card.status === 'expired'
                      ? 'bg-gray-100 text-gray-700 border-gray-500'
                      : 'bg-gray-100 text-gray-700 border-green-500'
                }`}
              >
                <div className="font-semibold">
                  {card.isCurse
                    ? '⚠ '
                    : isSpecialCard(card)
                      ? '✨ '
                      : card.status === 'expired'
                        ? 'Expired '
                        : ''}
                  #{card.id} - {card.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {card.completedAt} ·{' '}
                  {card.points !== null ? `+${card.points} pts` : 'Variable points'} ·{' '}
                  {formatTime(card.timeLeftWhenCompleted)} remaining
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coinEdits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Coin Edit History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {coinEdits.map((edit, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg text-sm border-l-4 bg-yellow-50 text-gray-700 border-yellow-500"
              >
                <div className="font-semibold">
                  {edit.previousAmount} → {edit.newAmount} coins
                </div>
                <div className="text-xs text-gray-600 mt-1">{edit.timestamp}</div>
                <div className="text-xs text-gray-700 mt-2 italic">"{edit.comment}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fahrkartenHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Fahrkarten History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {fahrkartenHistory.map((fahrkarte: Fahrkarte) => {
              const waiting = Boolean(fahrkarte.startsAt && fahrkarte.startsAt > Date.now());
              const expired = !waiting && fahrkarte.expiresAt <= Date.now();
              const finished = Boolean(fahrkarte.finishedAt);
              return (
                <div
                  key={fahrkarte.id}
                  className={`p-3 rounded-lg text-sm border-l-4 ${finished || expired ? 'bg-gray-100 border-gray-500' : 'bg-emerald-50 border-emerald-500'}`}
                >
                  <div className="font-semibold">
                    {fahrkarte.isFree
                      ? 'Free Fahrkarte · 15 minutes'
                      : `${fahrkarte.stops} stops · ${Math.round(fahrkarte.durationSeconds / 60)} minutes`}{' '}
                    · {finished ? 'Finished' : expired ? 'Expired' : waiting ? 'Waiting' : 'Active'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(fahrkarte.purchasedAt).toLocaleString()} ·{' '}
                    {fahrkarte.isFree ? 'Free' : `💰 ${fahrkarte.cost} coins`}
                    {fahrkarte.finishedAt &&
                      ` · Finished ${new Date(fahrkarte.finishedAt).toLocaleString()}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
