import { useState, useEffect } from 'react';

const CEP_STORAGE_KEY = 'grafica_client_cep';

/**
 * Hook para gerenciar o CEP do cliente
 * Persiste em localStorage e sincroniza entre páginas
 */
export function useClientCEP() {
  const [cep, setCepState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar CEP do localStorage ao montar
  useEffect(() => {
    try {
      const storedCEP = localStorage.getItem(CEP_STORAGE_KEY);
      if (storedCEP) {
        setCepState(storedCEP);
      }
    } catch (error) {
      console.error('Erro ao carregar CEP do localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar CEP no localStorage
  const setCEP = (newCEP: string) => {
    try {
      // Remover caracteres especiais
      const cleanCEP = newCEP.replace(/\D/g, '');
      
      // Validar se tem 8 dígitos
      if (cleanCEP.length === 8) {
        // Formatar com hífen
        const formattedCEP = `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
        setCepState(formattedCEP);
        localStorage.setItem(CEP_STORAGE_KEY, formattedCEP);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao salvar CEP:', error);
      return false;
    }
  };

  // Limpar CEP
  const clearCEP = () => {
    try {
      setCepState('');
      localStorage.removeItem(CEP_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar CEP:', error);
    }
  };

  return {
    cep,
    setCEP,
    clearCEP,
    isLoading,
  };
}
