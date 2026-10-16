-- Correzione applicata al progetto kbzyefqconrvdpadvipa dopo il controllo Advisors.
-- La funzione automatica resta disponibile al gestore dell’event trigger, non all’API pubblica.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
