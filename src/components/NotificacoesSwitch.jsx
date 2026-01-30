import { useState, useEffect } from 'react';
import { useMonetizacao } from '../context/MonetizacaoContext';

export default function NotificacoesSwitch() {
  const { assinatura } = useMonetizacao();
  const isPlanoPago = assinatura?.plano === 'basico' || assinatura?.plano === 'premium';
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(isPlanoPago);

  // Ativa automaticamente ao mudar para plano pago
  useEffect(() => {
    if (isPlanoPago) setNotificacoesAtivas(true);
    else setNotificacoesAtivas(false);
  }, [isPlanoPago]);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="font-medium text-gray-700">Notificações</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={notificacoesAtivas}
          onChange={() => isPlanoPago && setNotificacoesAtivas(v => !v)}
          disabled={!isPlanoPago}
        />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-all duration-200 ${!isPlanoPago ? 'opacity-60 cursor-not-allowed' : ''} relative`}>
          {/* Thumb branca */}
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${notificacoesAtivas ? 'translate-x-5' : ''}`}></span>
        </div>
        <span className="ml-2 text-sm text-gray-500">
          {isPlanoPago ? (notificacoesAtivas ? 'Ativadas' : 'Desativadas') : 'Disponível só para planos pagos'}
        </span>
      </label>
    </div>
  );
} 