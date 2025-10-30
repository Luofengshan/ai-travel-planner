import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ApiKeys {
  supabaseUrl: string;
  supabaseAnonKey: string;
  xunfeiAppId: string;
  xunfeiApiKey: string;
  xunfeiApiSecret: string;
  amapApiKey: string;
  aliyunAccessKeyId: string;
  aliyunAccessKeySecret: string;
  aliyunDashscopeApiKey: string;
}

interface SettingsContextType {
  apiKeys: ApiKeys;
  updateApiKeys: (keys: Partial<ApiKeys>) => void;
  isConfigured: boolean;
}

const defaultApiKeys: ApiKeys = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  xunfeiAppId: '',
  xunfeiApiKey: '',
  xunfeiApiSecret: '',
  amapApiKey: '',
  aliyunAccessKeyId: '',
  aliyunAccessKeySecret: '',
  aliyunDashscopeApiKey: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(defaultApiKeys);

  useEffect(() => {
    // 从localStorage加载API密钥
    const savedKeys = localStorage.getItem('api_keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys({ ...defaultApiKeys, ...parsedKeys });
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }

    // 从环境变量加载默认值
    const envKeys: Partial<ApiKeys> = {};
    if (import.meta.env.VITE_SUPABASE_URL) envKeys.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) envKeys.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (import.meta.env.VITE_XUNFEI_APP_ID) envKeys.xunfeiAppId = import.meta.env.VITE_XUNFEI_APP_ID;
    if (import.meta.env.VITE_XUNFEI_API_KEY) envKeys.xunfeiApiKey = import.meta.env.VITE_XUNFEI_API_KEY;
    if (import.meta.env.VITE_XUNFEI_API_SECRET) envKeys.xunfeiApiSecret = import.meta.env.VITE_XUNFEI_API_SECRET;
    if (import.meta.env.VITE_AMAP_API_KEY) envKeys.amapApiKey = import.meta.env.VITE_AMAP_API_KEY;
    if (import.meta.env.VITE_ALIYUN_ACCESS_KEY_ID) envKeys.aliyunAccessKeyId = import.meta.env.VITE_ALIYUN_ACCESS_KEY_ID;
    if (import.meta.env.VITE_ALIYUN_ACCESS_KEY_SECRET) envKeys.aliyunAccessKeySecret = import.meta.env.VITE_ALIYUN_ACCESS_KEY_SECRET;
    if (import.meta.env.VITE_ALIYUN_DASHSCOPE_API_KEY) envKeys.aliyunDashscopeApiKey = import.meta.env.VITE_ALIYUN_DASHSCOPE_API_KEY;

    if (Object.keys(envKeys).length > 0) {
      setApiKeys(prev => ({ ...prev, ...envKeys }));
    }
  }, []);

  const updateApiKeys = (newKeys: Partial<ApiKeys>) => {
    const updatedKeys = { ...apiKeys, ...newKeys };
    setApiKeys(updatedKeys);
    localStorage.setItem('api_keys', JSON.stringify(updatedKeys));
  };

  const isConfigured = Object.values(apiKeys).some(value => value.trim() !== '');

  const value = {
    apiKeys,
    updateApiKeys,
    isConfigured
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

