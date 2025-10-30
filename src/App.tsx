import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme, Button, Card, Typography, message } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AIService, TravelRequest, TravelItinerary } from './services/aiService';
import { travelPlanService } from './services/supabase';
import Login from './pages/Login';
import Register from './pages/Register';
import VoicePlanner from './pages/VoicePlanner';
import MyPlans from './pages/MyPlans';
import PlanView from './pages/PlanView';
import MapPlanning from './pages/MapPlanning';
import RoutePlanning from './pages/RoutePlanning';
import './index.css';

const { Content } = Layout;
const { Title, Text } = Typography;

// 简化的Dashboard组件
const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [plansCount, setPlansCount] = useState(0);
  
  // 加载用户的旅行计划数量
  useEffect(() => {
    const loadPlansCount = async () => {
      if (!user) return;
      try {
        const userPlans = await travelPlanService.getPlans(user.id);
        setPlansCount(userPlans.length);
      } catch (error) {
        console.error('加载计划数量失败:', error);
      }
    };
    loadPlansCount();
  }, [user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      message.success('已成功退出登录');
      navigate('/login');
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  
  // 如果用户不存在，显示加载状态
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'white', marginBottom: '8px' }}>
            欢迎回来, {user?.name || user?.email}!
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            管理您的旅行计划，开始新的冒险
          </p>
        </div>
        <Button onClick={handleSignOut} style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white' }}>
          退出登录
        </Button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* 我的计划卡片 */}
        <Card
          hoverable
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onClick={() => navigate('/my-plans')}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#52c41a' }}>
            📋
          </div>
          <Title level={3} style={{ color: '#52c41a', marginBottom: '8px' }}>我的计划</Title>
          <Text style={{ color: '#666', marginBottom: '8px' }}>查看和管理已保存的旅行计划</Text>
          <Text style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '16px' }}>
            {plansCount} 个计划
          </Text>
        </Card>

        {/* 创建新计划卡片 */}
        <Card
          hoverable
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onClick={() => navigate('/planner')}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#667eea' }}>
            ✈️
          </div>
          <Title level={3} style={{ color: '#667eea', marginBottom: '8px' }}>文字规划</Title>
          <Text style={{ color: '#666' }}>通过文字输入创建旅行计划</Text>
        </Card>

        {/* 语音规划卡片 */}
        <Card
          hoverable
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onClick={() => navigate('/voice-planner')}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ff6b6b' }}>
            🎤
          </div>
          <Title level={3} style={{ color: '#ff6b6b', marginBottom: '8px' }}>语音规划</Title>
          <Text style={{ color: '#666' }}>点击麦克风说出您的旅行需求</Text>
        </Card>

        {/* 地图规划卡片 */}
        <Card
          hoverable
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onClick={() => navigate('/route-planning')}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#52c41a' }}>
            🗺️
          </div>
          <Title level={3} style={{ color: '#52c41a', marginBottom: '8px' }}>地图规划</Title>
          <Text style={{ color: '#666' }}>基于高德地图的智能路线规划</Text>
        </Card>


      </div>

      {/* 功能说明（移动到页面底部，放在所有主要内容之后） */}
      <Card style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginTop: '32px'
      }}>
        <Title level={3} style={{ color: 'white', marginBottom: '16px' }}>🌍 AI旅行规划师功能</Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <Title level={4} style={{ color: '#ff6b6b', marginBottom: '8px' }}>🗺️ 地图导航</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              基于高德地图的位置服务功能
            </Text>
          </div>
          <div>
            <Title level={4} style={{ color: '#4ecdc4', marginBottom: '8px' }}>🤖 AI规划</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              阿里云大语言模型智能生成旅行路线
            </Text>
          </div>
          <div>
            <Title level={4} style={{ color: '#ff9f43', marginBottom: '8px' }}>🎤 语音识别</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              科大讯飞API将语音转文字，用于快捷生成旅行需求
            </Text>
          </div>
          <div>
            <Title level={4} style={{ color: '#feca57', marginBottom: '8px' }}>☁️ 云端同步</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              Supabase数据库，多设备数据同步
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 文字旅行规划页面
const TextPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState('');
  const [travelPlan, setTravelPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastPlanRaw, setLastPlanRaw] = useState<TravelItinerary | null>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<{ budgetStatus: 'over' | 'under' | 'on_track'; remainingBudget: number; suggestions: string[] } | null>(null);
  const { user } = useAuth();
  
  // 初始化AI服务（仅使用环境变量，不使用硬编码默认）
  const aiService = new AIService(
    (import.meta as any).env?.VITE_ALIBABA_ACCESS_KEY_ID ?? '',
    (import.meta as any).env?.VITE_ALIBABA_ACCESS_KEY_SECRET ?? '',
    (import.meta as any).env?.VITE_DASHSCOPE_API_KEY ?? ''
  );
  
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      message.warning('请输入您的旅行需求');
      return;
    }
    
    setLoading(true);
    message.success('需求已提交，正在生成旅行计划...');
    
    try {
      // 解析用户输入，提取旅行信息
      const travelRequest = parseTravelRequest(textInput);
      
      // 调用AI服务生成旅行计划
      let plan = await aiService.generateTravelPlan(travelRequest);
      // 强制以用户输入为准：覆盖AI返回的预算
      plan = { ...plan, budget: travelRequest.budget };
      
      // 转换为显示格式
      const displayPlan = {
        destination: plan.destination,
        duration: `${plan.duration}天${plan.duration - 1}夜`,
        budget: `${plan.budget}元`,
        highlights: plan.recommendations.slice(0, 4),
        itinerary: plan.days.map((day, index) => ({
          day: index + 1,
          activities: day.activities.map(activity => 
            `${activity.time} ${activity.activity} - ${activity.location} - ¥${Math.round(Number((activity as any).estimatedCost) || 0)}`
          )
        }))
      };
      
      setTravelPlan(displayPlan);
      setLastPlanRaw(plan);
      try {
        const analysis = await aiService.analyzeBudget(plan, [plan.totalEstimatedCost || 0]);
        setBudgetAnalysis(analysis);
      } catch {}
      message.success('旅行计划生成完成！');
    } catch (error) {
      console.error('生成旅行计划失败:', error);
      message.error('生成旅行计划失败，请重试');
      
      // 使用模拟数据作为备用
      setTravelPlan({
        destination: '日本东京',
        duration: '5天4夜',
        budget: '10000元',
        highlights: ['浅草寺', '东京塔', '秋叶原', '银座'],
        itinerary: [
          { day: 1, activities: ['抵达东京', '浅草寺参拜', '雷门拍照'] },
          { day: 2, activities: ['东京塔观光', '皇居外苑散步'] },
          { day: 3, activities: ['秋叶原购物', '动漫周边购买'] },
          { day: 4, activities: ['银座购物', '美食体验'] },
          { day: 5, activities: ['最后购物', '返程'] }
        ]
      });
      setLastPlanRaw(null);
      setBudgetAnalysis(null);
    } finally {
      setLoading(false);
    }
  };
  
  // 解析用户输入，提取旅行信息
  const parseTravelRequest = (input: string): TravelRequest => {
    // 简单的关键词提取逻辑
    const destinationMatch = input.match(/(?:去|到|前往)([^，,。！!？?]+)/);
    const durationMatch = input.match(/(\d+)天/);
    const budgetMatch = input.match(/(\d+)(?:元|万|千)/);
    
    const destination = destinationMatch ? destinationMatch[1].trim() : '未知目的地';
    const duration = durationMatch ? parseInt(durationMatch[1]) : 5;
    const budget = budgetMatch
      ? parseInt(budgetMatch[1]) * (budgetMatch[0].includes('万') ? 10000 : budgetMatch[0].includes('千') ? 1000 : 1)
      : 10000;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);
    
    return {
      destination,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      budget,
      travelers: 1,
      preferences: input
    };
  };

  return (
    <div style={{ 
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <Button 
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: '16px' }}
        >
          ← 返回首页
        </Button>
        <Title level={1} style={{ color: 'white', marginBottom: '8px' }}>
          ✍️ 文字旅行规划
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
          输入您的旅行需求，AI为您生成个性化行程
        </Text>
      </div>

      {/* 文字输入区域 */}
      <Card style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        marginBottom: '24px'
      }}>
        <Title level={3} style={{ color: '#333', marginBottom: '16px' }}>✍️ 文字输入</Title>
        <Text style={{ color: '#666', display: 'block', marginBottom: '16px' }}>
          输入您的旅行需求
        </Text>
        <div style={{ marginBottom: '16px' }}>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例如：我想去日本东京，5天4夜，预算1万元，喜欢美食和动漫"
            style={{
              width: '100%',
              height: '100px',
              padding: '12px',
              border: '2px solid #d9d9d9',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
        <Button 
          type="primary" 
          onClick={handleTextSubmit}
          loading={loading}
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          🚀 生成旅行计划
        </Button>
      </Card>

      {/* 旅行计划结果 */}
      {travelPlan && (
        <Card style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <Title level={3} style={{ color: '#333', marginBottom: '16px' }}>📋 您的旅行计划</Title>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>目的地：</Text>
            <Text>{travelPlan.destination}</Text>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>行程时长：</Text>
            <Text>{travelPlan.duration}</Text>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>预算：</Text>
            <Text>{travelPlan.budget}</Text>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>推荐景点：</Text>
            <div style={{ marginTop: '8px' }}>
              {travelPlan.highlights.map((highlight: string, index: number) => (
                <span key={index} style={{ 
                  display: 'inline-block',
                  background: '#667eea',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  margin: '4px',
                  fontSize: '12px'
                }}>
                  {highlight}
                </span>
              ))}
            </div>
          </div>
          <div>
            <Text strong>详细行程：</Text>
            <div style={{ marginTop: '12px' }}>
              {travelPlan.itinerary.map((day: any, index: number) => (
                <div key={index} style={{ 
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <Text strong style={{ color: '#667eea' }}>第{day.day}天：</Text>
                  <div style={{ marginTop: '4px' }}>
                    {day.activities.map((activity: string, actIndex: number) => (
                      <div key={actIndex} style={{ marginLeft: '16px', color: '#666' }}>
                        • {activity}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 预算分析区块 */}
      {budgetAnalysis && lastPlanRaw && (
        <Card style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ color: '#333' }}>
            <Title level={3} style={{ color: '#333', marginBottom: '16px' }}>💰 预算分析</Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 12 }}>
                <Text strong style={{ color: '#333' }}>预算状态：</Text>
                <Text style={{ marginLeft: 8, color: '#333' }}>
                  {budgetAnalysis.budgetStatus === 'over' ? '超支' : budgetAnalysis.budgetStatus === 'under' ? '充足' : '正常'}
                </Text>
              </div>
              <div style={{ background: '#f6ffed', borderRadius: 8, padding: 12 }}>
                <Text strong style={{ color: '#333' }}>剩余预算：</Text>
                <Text style={{ marginLeft: 8, color: '#333' }}>¥{budgetAnalysis.remainingBudget}</Text>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text strong>建议：</Text>
              <ul style={{ marginTop: 6 }}>
                {budgetAnalysis.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            {/* 费用明细（逐项列出，与保存后的展示口径一致） */}
            <div style={{ marginTop: 16 }}>
              <Title level={4} style={{ color: '#333', marginBottom: 8 }}>🧾 费用明细</Title>
              <div>
                {lastPlanRaw.days.map((day, di) => {
                  const daySubtotal = day.activities.reduce((sum, a) => sum + (Number((a as any).estimatedCost) || 0), 0);
                  return (
                    <div key={di} style={{ marginBottom: 12, background: '#f8f9fa', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontWeight: 600, color: '#667eea', marginBottom: 6 }}>第{di + 1}天 - {day.date}</div>
                      <div>
                        {day.activities.map((act: any, ai: number) => (
                          <div key={ai} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'white', borderRadius: 6, border: '1px solid #e9ecef', marginBottom: 6 }}>
                            <div style={{ color: '#333' }}>
                              <span style={{ color: '#555', marginRight: 8 }}>{act.time}</span>
                              <span style={{ fontWeight: 500 }}>{act.activity}</span>
                              {act.location ? <span style={{ marginLeft: 8, color: '#999' }}>· {act.location}</span> : null}
                            </div>
                            <div style={{ color: '#52c41a', fontWeight: 600 }}>¥{Math.round(Number(act.estimatedCost) || 0)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                        <Text strong style={{ color: '#333' }}>当日小计：</Text>
                        <Text style={{ marginLeft: 8, color: '#fa8c16', fontWeight: 600 }}>¥{Math.round(daySubtotal)}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Text strong style={{ color: '#333' }}>总预估费用：</Text>
                <Text style={{ marginLeft: 8, color: '#fa541c', fontWeight: 700 }}>¥{Math.round(Number(lastPlanRaw.totalEstimatedCost) || 0)}</Text>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 保存计划 */}
      {lastPlanRaw && user && (
        <Card style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <Title level={3} style={{ color: '#333', marginBottom: '16px' }}>💾 保存旅行计划</Title>
          <Text style={{ color: '#666', marginBottom: '20px', display: 'block' }}>
            将您的旅行计划保存到云端，方便随时查看和管理
          </Text>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button 
              type="primary"
              size="large"
              onClick={async () => {
                try {
                  const title = `${lastPlanRaw.destination} ${lastPlanRaw.duration}日游`;
                  await travelPlanService.createPlan({
                    user_id: user.id,
                    title,
                    destination: lastPlanRaw.destination,
                    start_date: lastPlanRaw.days[0]?.date || '',
                    end_date: lastPlanRaw.days[lastPlanRaw.days.length - 1]?.date || '',
                    budget: lastPlanRaw.budget,
                    travelers: lastPlanRaw.travelers,
                    preferences: lastPlanRaw.preferences,
                    itinerary: lastPlanRaw
                  });
                  message.success('✅ 旅行计划已保存到云端！');
                  // 延迟跳转到我的计划页面
                  setTimeout(() => {
                    navigate('/my-plans');
                  }, 1500);
                } catch (e) {
                  console.error(e);
                  message.error('❌ 保存失败，请稍后重试');
                }
              }}
              style={{ 
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0 24px'
              }}
            >
              💾 保存计划
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/my-plans')}
              style={{ 
                borderRadius: '8px',
                padding: '0 24px'
              }}
            >
              📋 查看我的计划
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
};



const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('认证状态:', { user, loading });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>加载中...</div>
      </div>
    );
  }

  // 强制检查：如果localStorage中没有认证信息，强制显示登录页面
  const hasAuthToken = localStorage.getItem('auth_token');
  const isAuthenticated = !!user && !!hasAuthToken;
  
  console.log('最终认证状态:', isAuthenticated, '用户:', user, 'Token:', hasAuthToken);
  
  // 如果未登录，强制显示登录页面
  if (!isAuthenticated) {
    console.log('用户未登录，显示登录页面');
    return (
      <Router>
        <Layout className="travel-planner-container">
          <Content style={{ padding: '0' }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Content>
        </Layout>
      </Router>
    );
  }

  return (
    <Router>
      <Layout className="travel-planner-container">
        <Content style={{ padding: '0' }}>
          <Routes>
            <Route 
              path="/login" 
              element={<Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={<Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard />} 
            />
            <Route 
              path="/planner" 
              element={<TextPlanner />} 
            />
            <Route 
              path="/voice-planner" 
              element={<VoicePlanner />} 
            />
            <Route 
              path="/map-planning" 
              element={<MapPlanning />} 
            />
            <Route 
              path="/route-planning" 
              element={<RoutePlanning />} 
            />
            <Route 
              path="/my-plans" 
              element={<MyPlans />} 
            />
            <Route 
              path="/plan-view" 
              element={<PlanView />} 
            />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  console.log('App组件开始渲染');

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#667eea',
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;