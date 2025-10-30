import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Empty, Spin, message, Popconfirm, Tag } from 'antd';
import { 
  CalendarOutlined, 
  DollarOutlined, 
  UserOutlined, 
  EnvironmentOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { travelPlanService, TravelPlan } from '../services/supabase';

const { Title, Text } = Typography;

const MyPlans: React.FC = () => {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('开始加载用户的旅行计划, 用户ID:', user.id);
      const userPlans = await travelPlanService.getPlans(user.id);
      console.log('加载到的计划数量:', userPlans.length);
      setPlans(userPlans);
    } catch (error) {
      message.error('加载旅行计划失败');
      console.error('加载计划失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      console.log('开始删除计划:', planId);
      await travelPlanService.deletePlan(planId);
      setPlans(plans.filter(plan => plan.id !== planId));
      message.success('✅ 旅行计划已删除');
      console.log('删除成功，当前计划数量:', plans.length - 1);
    } catch (error) {
      message.error('❌ 删除计划失败');
      console.error('删除计划失败:', error);
    }
  };

  const handleViewPlan = (planId: string) => {
    navigate(`/plan-view?id=${planId}`);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={1} style={{ marginBottom: '8px', color: '#333' }}>
              📋 我的旅行计划
            </Title>
            <Text style={{ color: '#666', fontSize: '16px' }}>
              查看和删除您保存的所有旅行计划
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/voice-planner')}
              style={{ 
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              🎤 语音规划
            </Button>
            <Button 
              onClick={() => navigate('/planner')}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            >
              ✈️ 文字规划
            </Button>
          </div>
        </div>
        
        {user && (
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>
              👤 当前用户: {user.name || user.email} | 共 {plans.length} 个计划
            </Text>
          </div>
        )}
      </div>

      {/* 返回按钮 */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: '16px' }}
        >
          ← 返回首页
        </Button>
      </div>

      {/* 计划列表 */}
      {plans.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>
                  还没有保存的旅行计划
                </div>
                <div style={{ color: '#999', marginBottom: '24px' }}>
                  创建您的第一个旅行计划，开始规划美好的旅程
                </div>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/planner')}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  ✈️ 创建第一个计划
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {plans.map((plan) => (
            <Col xs={24} sm={12} lg={8} key={plan.id}>
              <Card
                hoverable
                style={{
                  borderRadius: '16px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                actions={[
                  <Button 
                    key="view" 
                    type="text" 
                    icon={<EyeOutlined />}
                    onClick={() => handleViewPlan(plan.id)}
                    style={{ color: '#1890ff', fontWeight: 'bold' }}
                  >
                    👁️ 查看详情
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="🗑️ 删除旅行计划"
                    description="确定要删除这个旅行计划吗？删除后将无法恢复！"
                    onConfirm={() => handleDeletePlan(plan.id)}
                    okText="确定删除"
                    cancelText="取消"
                    okType="danger"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      style={{ color: '#ff4d4f' }}
                    >
                      删除计划
                    </Button>
                  </Popconfirm>
                ]}
              >
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ marginBottom: '12px', color: '#333' }}>
                    {plan.title}
                  </Title>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <EnvironmentOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      <Text strong style={{ color: '#333' }}>{plan.destination}</Text>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <CalendarOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      <Text>
                        {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                      </Text>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <CalendarOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      <Text>{getDaysBetween(plan.start_date, plan.end_date)} 天</Text>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <DollarOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      <Text>预算: ¥{plan.budget.toLocaleString()}</Text>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <UserOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      <Text>{plan.travelers} 人</Text>
                    </div>
                  </div>

                  {plan.preferences && (
                    <div style={{ 
                      background: 'rgba(102, 126, 234, 0.1)',
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        偏好: {plan.preferences}
                      </Text>
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    <Tag color="blue" style={{ fontSize: '11px' }}>
                      创建于 {formatDate(plan.created_at)}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      ID: {plan.id.slice(0, 8)}...
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MyPlans;
