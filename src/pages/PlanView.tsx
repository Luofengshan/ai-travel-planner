import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Timeline, Tag, Spin, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, DollarOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { travelPlanService, TravelPlan } from '../services/supabase';

const { Title, Text } = Typography;

const PlanView: React.FC = () => {
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('id');

  useEffect(() => {
    if (planId && user) {
      loadPlan();
    }
  }, [planId, user]);

  const loadPlan = async () => {
    if (!planId || !user) return;
    
    try {
      setLoading(true);
      const planData = await travelPlanService.getPlan(planId);
      if (planData && planData.user_id === user.id) {
        setPlan(planData);
      } else {
        message.error('计划不存在或无权限访问');
        navigate('/my-plans');
      }
    } catch (error) {
      message.error('加载计划失败');
      console.error('加载计划失败:', error);
      navigate('/my-plans');
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

  if (!plan) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Title level={3}>计划不存在</Title>
          <Button onClick={() => navigate('/my-plans')}>
            返回我的计划
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Button 
            onClick={() => navigate('/my-plans')}
            icon={<ArrowLeftOutlined />}
            style={{ marginBottom: '16px' }}
          >
            返回我的计划
          </Button>
        </div>
        <Title level={1} style={{ marginBottom: '8px', color: '#333' }}>
          📋 {plan.title}
        </Title>
        <Text style={{ color: '#666', fontSize: '16px' }}>
          查看您的旅行计划详情
        </Text>
      </div>

      {/* 计划基本信息 */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ marginBottom: '16px' }}>📊 计划概览</Title>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
              <EnvironmentOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>目的地</div>
              <div style={{ fontSize: '16px', marginTop: '4px' }}>{plan.destination}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
              <CalendarOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontWeight: 'bold', color: '#52c41a' }}>天数</div>
              <div style={{ fontSize: '16px', marginTop: '4px' }}>{getDaysBetween(plan.start_date, plan.end_date)} 天</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fff2e8', borderRadius: '8px' }}>
              <DollarOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
              <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>预算</div>
              <div style={{ fontSize: '16px', marginTop: '4px' }}>¥{plan.budget.toLocaleString()}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f9f0ff', borderRadius: '8px' }}>
              <UserOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
              <div style={{ fontWeight: 'bold', color: '#722ed1' }}>同行人数</div>
              <div style={{ fontSize: '16px', marginTop: '4px' }}>{plan.travelers} 人</div>
            </div>
          </Col>
        </Row>
        
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <CalendarOutlined style={{ marginRight: '8px', color: '#667eea' }} />
            <Text strong>出行时间：</Text>
            <Text style={{ marginLeft: '8px' }}>
              {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
            </Text>
          </div>
          {plan.preferences && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Text strong>旅行偏好：</Text>
              <Text style={{ marginLeft: '8px' }}>{plan.preferences}</Text>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text strong>创建时间：</Text>
            <Text style={{ marginLeft: '8px' }}>{formatDate(plan.created_at)}</Text>
          </div>
        </div>
      </Card>

      {/* 详细行程 */}
      {plan.itinerary && typeof plan.itinerary === 'object' && plan.itinerary.days ? (
        <Card>
          <Title level={3} style={{ marginBottom: '16px' }}>📅 详细行程安排</Title>
          <Timeline>
            {plan.itinerary.days.map((day: any, dayIndex: number) => (
              <Timeline.Item key={dayIndex} color="blue">
                <div className="timeline-item">
                  <Title level={4} style={{ color: '#667eea', marginBottom: '12px' }}>
                    第{dayIndex + 1}天 - {day.date}
                  </Title>
                  {day.activities && day.activities.map((activity: any, activityIndex: number) => (
                    <div key={activityIndex} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <Tag color="blue">{activity.time}</Tag>
                        <Text strong style={{ marginLeft: '8px' }}>{activity.activity}</Text>
                        <Tag color="green" style={{ marginLeft: '8px' }}>
                          ¥{activity.estimatedCost}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ marginLeft: '8px' }}>
                        📍 {activity.location}
                      </Text>
                      {activity.description && (
                        <div style={{ marginTop: '4px', marginLeft: '8px' }}>
                          <Text type="secondary">{activity.description}</Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ) : (
        <Card>
          <Title level={3} style={{ marginBottom: '16px' }}>📅 行程信息</Title>
          <Text type="secondary">暂无详细行程信息</Text>
        </Card>
      )}

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <Button 
          size="large"
          onClick={() => navigate('/my-plans')}
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            marginRight: '16px'
          }}
        >
          返回我的计划
        </Button>
        <Button 
          size="large"
          onClick={() => navigate('/dashboard')}
          style={{ 
            borderRadius: '8px'
          }}
        >
          返回首页
        </Button>
      </div>
    </div>
  );
};

export default PlanView;
