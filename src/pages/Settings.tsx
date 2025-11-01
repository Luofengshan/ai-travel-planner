import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider, Row, Col, Alert } from 'antd';
import { KeyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useSettings } from '../contexts/SettingsContext';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const { apiKeys, updateApiKeys, isConfigured } = useSettings();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      updateApiKeys(values);
      message.success('API密钥已保存！');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
          ⚙️ 系统设置
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
          配置API密钥以启用所有功能
        </Text>
      </div>

      {!isConfigured && (
        <Alert
          message="API配置提醒"
          description="请配置必要的API密钥以使用完整功能。所有密钥都安全存储在本地，不会上传到服务器。"
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="settings-panel">
            <Title level={3} style={{ marginBottom: '24px' }}>
              <KeyOutlined style={{ marginRight: '8px', color: '#667eea' }} />
              API密钥配置
            </Title>

            <Form
              layout="vertical"
              initialValues={apiKeys}
              onFinish={onFinish}
            >
              <Title level={4} style={{ color: '#667eea', marginTop: '24px' }}>
                Supabase配置
              </Title>
              <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                用于用户认证和数据存储
              </Text>

              <Form.Item
                name="supabaseUrl"
                label="Supabase URL"
                rules={[{ required: true, message: '请输入Supabase URL' }]}
              >
                <Input
                  placeholder="https://your-project.supabase.co"
                  className="api-key-input"
                />
              </Form.Item>

              <Form.Item
                name="supabaseAnonKey"
                label="Supabase Anon Key"
                rules={[{ required: true, message: '请输入Supabase Anon Key' }]}
              >
                <Input.Password
                  placeholder="输入您的Supabase匿名密钥"
                  className="api-key-input"
                />
              </Form.Item>


              <Divider />

              <Title level={4} style={{ color: '#667eea' }}>
                高德地图API
              </Title>
              <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                用于地图显示和位置服务
              </Text>

              <Form.Item
                name="amapApiKey"
                label="高德地图API Key"
                rules={[{ required: true, message: '请输入高德地图API Key' }]}
              >
                <Input.Password
                  placeholder="输入高德地图API Key"
                  className="api-key-input"
                />
              </Form.Item>

              <Divider />

              <Title level={4} style={{ color: '#667eea' }}>
                阿里云大语言模型
              </Title>
              <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                用于AI行程规划和智能分析
              </Text>

              <Form.Item
                name="aliyunAccessKeyId"
                label="Access Key ID"
              >
                <Input
                  placeholder="输入阿里云Access Key ID"
                  className="api-key-input"
                />
              </Form.Item>

              <Form.Item
                name="aliyunAccessKeySecret"
                label="Access Key Secret"
              >
                <Input.Password
                  placeholder="输入阿里云Access Key Secret"
                  className="api-key-input"
                />
              </Form.Item>

              <Form.Item
                name="aliyunDashscopeApiKey"
                label="DashScope API Key"
              >
                <Input.Password
                  placeholder="输入DashScope API Key"
                  className="api-key-input"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: '32px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '48px',
                    padding: '0 32px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  保存配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="settings-panel">
            <Title level={4} style={{ marginBottom: '16px' }}>
              <InfoCircleOutlined style={{ marginRight: '8px', color: '#667eea' }} />
              配置说明
            </Title>

            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>🔐 安全提示</Title>
              <Text type="secondary">
                所有API密钥都安全存储在您的浏览器本地存储中，不会上传到任何服务器。
              </Text>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>📋 获取API密钥</Title>
              <ul style={{ paddingLeft: '20px' }}>
                <li>
                  <Text type="secondary">
                    <strong>Supabase:</strong> 在supabase.com创建项目
                  </Text>
                </li>
                <li>
                  <Text type="secondary">
                    <strong>高德地图:</strong> 在lbs.amap.com申请Web服务
                  </Text>
                </li>
                <li>
                  <Text type="secondary">
                    <strong>阿里云:</strong> 在dashscope.aliyun.com申请服务
                  </Text>
                </li>
              </ul>
            </div>

            <div>
              <Title level={5}>⚡ 功能状态</Title>
              <div style={{ marginBottom: '8px' }}>
                <Text>用户认证: </Text>
                <Text type={apiKeys.supabaseUrl && apiKeys.supabaseAnonKey ? 'success' : 'danger'}>
                  {apiKeys.supabaseUrl && apiKeys.supabaseAnonKey ? '已配置' : '未配置'}
                </Text>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text>地图服务: </Text>
                <Text type={apiKeys.amapApiKey ? 'success' : 'danger'}>
                  {apiKeys.amapApiKey ? '已配置' : '未配置'}
                </Text>
              </div>
              <div>
                <Text>AI服务: </Text>
                <Text type={apiKeys.aliyunDashscopeApiKey ? 'success' : 'warning'}>
                  {apiKeys.aliyunDashscopeApiKey ? '已配置' : '可选'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;

