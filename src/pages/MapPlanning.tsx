import React, { useEffect, useRef, useState } from 'react';
import { Card, Button, Input, Typography, Row, Col, message, Space, Tag } from 'antd';
import { EnvironmentOutlined, SearchOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 声明高德地图API
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

const MapPlanning: React.FC = () => {
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const drivingInstance = useRef<any>(null);

  // 高德地图配置（从环境变量读取）
  const AMAP_KEY = (import.meta as any).env?.VITE_AMAP_API_KEY || '';
  const AMAP_SECRET = (import.meta as any).env?.VITE_AMAP_SECURITY_JS_CODE || '';

  useEffect(() => {
    // 设置安全密钥 - 必须在API加载前设置
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECRET
    };

    loadAmapScript();
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }
    };
  }, []);

  const loadAmapScript = () => {
    if (window.AMap) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Driving`;
    script.async = true;
    script.onload = () => {
      initMap();
    };
    script.onerror = () => {
      message.error('高德地图API加载失败');
    };
    document.head.appendChild(script);
  };

  const initMap = () => {
    if (!mapRef.current || !window.AMap) return;

    try {
      mapInstance.current = new window.AMap.Map(mapRef.current, {
        viewMode: '2D',
        zoom: 11,
        center: [116.397428, 39.90923],
        mapStyle: 'amap://styles/normal'
      });

      mapInstance.current.on('complete', () => {
        window.AMap.plugin(['AMap.Driving'], () => {
          drivingInstance.current = new window.AMap.Driving({
            map: mapInstance.current,
            autoFitView: true,
            showTraffic: true
          });
          console.log('驾车规划服务初始化完成');
        });
      });

      setMapLoaded(true);
      message.success('地图加载成功');
    } catch (error) {
      console.error('地图初始化失败:', error);
      message.error('地图初始化失败');
    }
  };

  const planRoute = () => {
    if (!startPoint.trim() || !endPoint.trim()) {
      message.warning('请输入起点和终点');
      return;
    }

    if (!drivingInstance.current) {
      message.error('地图未初始化完成');
      return;
    }

    setLoading(true);
    
    try {
      const waypoints = [
        { keyword: startPoint.trim(), city: '北京' },
        { keyword: endPoint.trim(), city: '北京' }
      ];
      
      console.log('开始规划路线:', waypoints);
      
      drivingInstance.current.search(waypoints, (status: string, result: any) => {
        setLoading(false);
        console.log('路线规划状态:', status);
        console.log('路线规划结果:', result);
        
        if (status === 'complete' && result && result.routes && result.routes.length > 0) {
          console.log('找到', result.routes.length, '条路线');
          setRouteInfo(result);
          message.success('路线规划成功');
        } else {
          console.log('路线规划失败或无结果:', status, result);
          message.warning('未找到可行路线，请检查起点和终点是否正确');
        }
      });
    } catch (error) {
      setLoading(false);
      console.error('路线规划错误:', error);
      message.error('路线规划失败，请检查网络连接');
    }
  };

  const clearRoute = () => {
    if (drivingInstance.current) {
      drivingInstance.current.clear();
    }
    setRouteInfo(null);
    setStartPoint('');
    setEndPoint('');
    message.info('已清空路线');
  };

  const reloadMap = () => {
    if (mapInstance.current) {
      mapInstance.current.destroy();
      mapInstance.current = null;
    }
    if (drivingInstance.current) {
      drivingInstance.current = null;
    }
    setMapLoaded(false);
    loadAmapScript();
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
          🗺️ 地图路线规划
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
          基于高德地图的智能路线规划服务
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card className="travel-card">
            <Title level={3} style={{ marginBottom: '24px' }}>
              📍 路线规划
            </Title>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>起点：</Text>
              <Input
                placeholder="请输入起点，如：天安门"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                prefix={<EnvironmentOutlined />}
                style={{ marginTop: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Text strong>终点：</Text>
              <Input
                placeholder="请输入终点，如：颐和园"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                prefix={<EnvironmentOutlined />}
                style={{ marginTop: '8px' }}
              />
            </div>

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={planRoute}
                loading={loading}
                disabled={!mapLoaded}
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                规划路线
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={clearRoute}
                style={{ borderRadius: '8px' }}
              >
                清空
              </Button>
            </Space>

            {/* 路线信息显示 */}
            {routeInfo && routeInfo.routes && routeInfo.routes.length > 0 && (
              <Card style={{ marginTop: '16px', background: 'rgba(82, 196, 26, 0.1)' }}>
                <Title level={4} style={{ color: '#52c41a', marginBottom: '12px' }}>
                  📊 路线信息
                </Title>
                {routeInfo.routes.map((route: any, index: number) => (
                  <div key={index} style={{ marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Text strong>路线 {index + 1}</Text>
                      <Tag color="blue">{route.distance ? (route.distance / 1000).toFixed(1) + 'km' : ''}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">
                        预计时间: {route.time ? Math.round(route.time / 60) + '分钟' : ''}
                      </Text>
                      <Text type="secondary">
                        {route.tolls ? '收费' : '免费'}
                      </Text>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card className="travel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Title level={3} style={{ margin: 0 }}>
                🗺️ 地图视图
              </Title>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={reloadMap}
                style={{ borderRadius: '6px' }}
              >
                重新加载
              </Button>
            </div>
            <div
              ref={mapRef}
              style={{
                height: '500px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                background: mapLoaded ? 'transparent' : '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '16px'
              }}
            >
              {!mapLoaded && '地图加载中...'}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MapPlanning;