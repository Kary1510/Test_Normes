import { createClient } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SKINS } from '../game/constants.js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _supabase = null;
function getSupabase() {
  if (!_supabase && SUPABASE_URL && SUPABASE_KEY) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _supabase;
}

const DEMO_USER = {
  id: 'demo',
  username: 'Joueur',
  coins: 0,
  ownedSkins: new Set(['default']),
  activeSkin: 'default',
};

export function useSupabase() {
  const sb = getSupabase();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);

  // Sync profile ref
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sb) {
      // Demo mode (no Supabase configured)
      setUser({ id: 'demo', email: 'demo@worldhopper.io' });
      setProfile({ ...DEMO_USER, ownedSkins: new Set(['default']) });
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile(userId) {
    setLoading(true);
    try {
      // Profiles
      const { data: prof } = await sb
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Owned skins
      const { data: skinRows } = await sb
        .from('owned_skins')
        .select('skin_id')
        .eq('user_id', userId);

      // Active skin
      const { data: activeSkinRow } = await sb
        .from('active_skin')
        .select('skin_id')
        .eq('user_id', userId)
        .single();

      const ownedSkins = new Set(['default']);
      (skinRows || []).forEach(r => ownedSkins.add(r.skin_id));

      setProfile({
        id: userId,
        username: prof?.username || 'Joueur',
        coins: prof?.coins || 0,
        totalItems: prof?.total_items || 0,
        totalWorldsVisited: prof?.total_worlds_visited || 0,
        ownedSkins,
        activeSkin: activeSkinRow?.skin_id || 'default',
      });
    } catch {
      setProfile({ ...DEMO_USER, id: userId });
    } finally {
      setLoading(false);
    }
  }

  // ── Auth actions ─────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    if (!sb) return { error: null };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return { error };
  }, [sb]);

  const signUp = useCallback(async (email, password, username) => {
    if (!sb) return { error: null };
    const { data, error } = await sb.auth.signUp({ email, password });
    if (!error && data.user) {
      await sb.from('profiles').upsert({ user_id: data.user.id, username, coins: 0, total_items: 0, total_worlds_visited: 0 });
      await sb.from('owned_skins').insert({ user_id: data.user.id, skin_id: 'default' });
      await sb.from('active_skin').upsert({ user_id: data.user.id, skin_id: 'default' });
    }
    return { error };
  }, [sb]);

  const signInWithGoogle = useCallback(async () => {
    if (!sb) return;
    await sb.auth.signInWithOAuth({ provider: 'google' });
  }, [sb]);

  const signOut = useCallback(async () => {
    if (!sb) { setUser(null); setProfile(null); return; }
    await sb.auth.signOut();
  }, [sb]);

  // ── Game actions ─────────────────────────────────────────────────────────
  const addCoins = useCallback(async (amount) => {
    setProfile(p => {
      if (!p) return p;
      const next = { ...p, coins: p.coins + amount, totalItems: p.totalItems + 1 };
      if (sb && p.id !== 'demo') {
        sb.from('profiles').update({ coins: next.coins, total_items: next.totalItems }).eq('user_id', p.id);
      }
      return next;
    });
  }, [sb]);

  const buySkin = useCallback(async (skinId) => {
    const p = profileRef.current;
    if (!p) return false;
    const skin = SKINS[skinId];
    if (!skin || p.ownedSkins.has(skinId) || p.coins < skin.cost) return false;

    const newCoins = p.coins - skin.cost;
    const newOwned = new Set([...p.ownedSkins, skinId]);
    setProfile(prev => ({ ...prev, coins: newCoins, ownedSkins: newOwned }));

    if (sb && p.id !== 'demo') {
      await sb.from('profiles').update({ coins: newCoins }).eq('user_id', p.id);
      await sb.from('owned_skins').insert({ user_id: p.id, skin_id: skinId, unlocked_at: new Date().toISOString() });
    }
    return true;
  }, [sb]);

  const setActiveSkin = useCallback(async (skinId) => {
    const p = profileRef.current;
    if (!p || !p.ownedSkins.has(skinId)) return;
    setProfile(prev => ({ ...prev, activeSkin: skinId }));
    if (sb && p.id !== 'demo') {
      await sb.from('active_skin').upsert({ user_id: p.id, skin_id: skinId });
    }
  }, [sb]);

  return { user, profile, loading, signIn, signUp, signInWithGoogle, signOut, addCoins, buySkin, setActiveSkin };
}
