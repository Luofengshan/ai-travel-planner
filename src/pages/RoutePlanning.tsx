import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';



// 声明高德地图API
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

interface Waypoint {
  keyword: string;
  city: string;
}

interface Route {
  distance: number;
  time: number;
  tolls: boolean;
  steps: Array<{
    instruction: string;
    distance: number;
  }>;
}

const RoutePlanning: React.FC = () => {
  const navigate = useNavigate();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { keyword: '', city: '北京' }, // 起点
    { keyword: '', city: '北京' }  // 终点
  ]);

  const [routeResults, setRouteResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [waypointCount, setWaypointCount] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState<boolean>(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const drivingInstance = useRef<any>(null);
  const currentRoute = useRef<any>(null);

  // 高德地图配置（从环境变量读取）
  const AMAP_KEY = (import.meta as any).env?.VITE_AMAP_API_KEY || '';
  const AMAP_SECRET = (import.meta as any).env?.VITE_AMAP_SECURITY_JS_CODE || '';

  useEffect(() => {
    // 设置安全密钥 - 必须在API加载前设置
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECRET
    };

    // 延迟加载，确保DOM已渲染
    const timer = setTimeout(() => {
      loadAmapScript();
    }, 100);

    return () => {
      clearTimeout(timer);
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
    if (!mapRef.current) {
      console.error('地图容器未找到');
      setTimeout(() => initMap(), 200);
      return;
    }

    if (!window.AMap) {
      console.error('高德地图API未加载');
      message.error('高德地图API未加载');
      return;
    }

    try {
      console.log('开始初始化地图...');
      mapInstance.current = new window.AMap.Map(mapRef.current, {
        viewMode: '2D',
        zoom: 11,
        center: [116.397428, 39.90923],
        mapStyle: 'amap://styles/normal'
      });

      console.log('地图实例创建成功');

      mapInstance.current.on('complete', () => {
        console.log('地图加载完成');
        window.AMap.plugin(['AMap.Driving'], () => {
          drivingInstance.current = new window.AMap.Driving({
            map: mapInstance.current,
            autoFitView: true,
            showTraffic: true
          });
          console.log('驾车规划服务初始化完成');
        });
      });

      // 强制刷新地图显示
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.getSize();
          mapInstance.current.setFitView();
        }
      }, 100);

      setMapLoaded(true);
      message.success('地图加载成功');
    } catch (error) {
      console.error('地图初始化失败:', error);
      message.error('地图初始化失败: ' + (error as Error).message);
    }
  };

  const getWaypoints = (): Waypoint[] => {
    return waypoints.filter(wp => wp.keyword.trim());
  };

  const addWaypoint = () => {
    const newCount = waypointCount + 1;
    setWaypointCount(newCount);
    // 在终点前插入新的途经点
    const newWaypoints = [...waypoints];
    newWaypoints.splice(waypoints.length - 1, 0, { keyword: '', city: '北京' });
    setWaypoints(newWaypoints);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    setWaypointCount(waypointCount - 1);
  };

  const updateWaypoint = (index: number, keyword: string) => {
    setWaypoints(prevWaypoints => {
      const newWaypoints = [...prevWaypoints];
      newWaypoints[index] = { ...newWaypoints[index], keyword };
      return newWaypoints;
    });
  };

  const planRoute = () => {
    const validWaypoints = getWaypoints();
    if (validWaypoints.length < 2) {
      message.warning('请至少输入起点和终点');
      return;
    }

    if (!drivingInstance.current) {
      message.error('地图未初始化完成');
      return;
    }

    setLoading(true);
    
    try {
      console.log('开始规划路线:', validWaypoints);
      
      // 清除之前的路线
      if (currentRoute.current) {
        drivingInstance.current.clear();
      }

      drivingInstance.current.search(validWaypoints, (status: string, result: any) => {
        setLoading(false);
        console.log('路线规划状态:', status);
        console.log('路线规划结果:', result);
        
        if (status === 'complete' && result && result.routes && result.routes.length > 0) {
          console.log('找到', result.routes.length, '条路线');
          setRouteResults(result);
          currentRoute.current = result;
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
    setRouteResults(null);
    currentRoute.current = null;
    
    // 重置为初始状态
    setWaypoints([
      { keyword: '', city: '北京' }, // 起点
      { keyword: '', city: '北京' }  // 终点
    ]);
    setWaypointCount(0);
    message.info('已清空路线');
  };

  const goToDashboard = () => {
    // 使用React Router导航
    navigate('/dashboard');
  };

  const formatDistance = (distance: number) => {
    return distance ? (distance / 1000).toFixed(1) + '公里' : '';
  };

  const selectRoute = (routeIndex: number) => {
    console.log('选择路线:', routeIndex);
    setSelectedRoute(routeIndex);
    setShowRouteDetails(true);
    setIsDetailsExpanded(true); // 选择新路线时自动展开详情
    
    if (drivingInstance.current && routeResults && routeResults.routes[routeIndex]) {
      // 清除之前的路线
      drivingInstance.current.clear();
      
      // 重新搜索并显示选中的路线
      const validWaypoints = getWaypoints();
      drivingInstance.current.search(validWaypoints, (status: string, result: any) => {
        if (status === 'complete' && result && result.routes && result.routes.length > routeIndex) {
          console.log('路线显示成功');
          message.success(`已显示路线 ${routeIndex + 1}`);
          
          // 高亮显示选中的路线
          if (result.routes[routeIndex]) {
            const selectedRouteData = result.routes[routeIndex];
            console.log('选中路线详情:', selectedRouteData);
          }
        }
      });
    }
  };

  const formatTime = (time: number) => {
    return time ? Math.round(time / 60) + '分钟' : '';
  };

  return (
    <div style={{ 
      padding: '0', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex'
    }}>
      {/* 路线规划面板 */}
      <div style={{
        width: '400px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        margin: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        height: 'calc(100vh - 40px)'
      }}>
        {/* 头部 */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>🗺️ 多地点路线规划</span>
            <Button
              type="text"
              onClick={goToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: '8px'
              }}
              icon={<ArrowLeftOutlined />}
            >
              返回首页
            </Button>
          </div>

          {/* 起点 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '10px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              padding: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white',
                marginRight: '10px',
                flexShrink: 0
              }}>
                起
              </div>
              <Input
                placeholder="请输入起点..."
                value={waypoints[0]?.keyword || ''}
                onChange={(e) => updateWaypoint(0, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.target.select()}
                style={{
                  flex: 1,
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  outline: 'none',
                  zIndex: 10,
                  position: 'relative',
                  color: '#000',
                  fontSize: '14px'
                }}
                autoFocus={false}
              />
              <Button
                type="text"
                onClick={addWaypoint}
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginLeft: '10px'
                }}
              >
                +
              </Button>
            </div>
          </div>

          {/* 途经点 */}
          {waypoints.slice(1, -1).map((waypoint, index) => {
            const actualIndex = index + 1; // 途经点在waypoints数组中的实际索引
            return (
              <div key={actualIndex} style={{ marginBottom: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '8px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    marginRight: '10px',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <Input
                    placeholder="请输入途经点..."
                    value={waypoint.keyword}
                    onChange={(e) => updateWaypoint(actualIndex, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.target.select()}
                    style={{
                      flex: 1,
                      background: 'white',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      outline: 'none',
                      zIndex: 10,
                      position: 'relative',
                      color: '#000',
                      fontSize: '14px'
                    }}
                    autoFocus={false}
                  />
                  <Button
                    type="text"
                    onClick={() => removeWaypoint(actualIndex)}
                    style={{
                      width: '24px',
                      height: '24px',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      marginLeft: '10px'
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            );
          })}

          {/* 终点 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              padding: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white',
                marginRight: '10px',
                flexShrink: 0
              }}>
                终
              </div>
              <Input
                placeholder="请输入终点..."
                value={waypoints[waypoints.length - 1]?.keyword || ''}
                onChange={(e) => updateWaypoint(waypoints.length - 1, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.target.select()}
                style={{
                  flex: 1,
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  outline: 'none',
                  zIndex: 10,
                  position: 'relative',
                  color: '#000',
                  fontSize: '14px'
                }}
                autoFocus={false}
              />
              <Button
                type="text"
                onClick={addWaypoint}
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginLeft: '10px'
                }}
              >
                +
              </Button>
            </div>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              type="primary"
              onClick={planRoute}
              loading={loading}
              disabled={!mapLoaded}
              style={{
                flex: 1,
                background: '#40a9ff',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              规划路线
            </Button>
            <Button
              onClick={clearRoute}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px'
              }}
            >
              清除路线
            </Button>
          </div>
        </div>

        {/* 结果面板 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {!routeResults ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              请输入起点和终点开始规划路线
            </div>
          ) : routeResults.routes && routeResults.routes.length > 0 ? (
            <div>
              {/* 路线摘要 */}
              <div style={{
                background: '#f8f9fa',
                padding: '15px 20px',
                borderBottom: '1px solid #e9ecef'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  路线规划完成
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span>共找到 {routeResults.routes.length} 条路线</span>
                  <span>点击路线查看详情</span>
                </div>
              </div>

              {/* 路线列表 */}
              {routeResults.routes.map((route: Route, index: number) => (
                <div 
                  key={index} 
                  onClick={() => selectRoute(index)}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: selectedRoute === index ? '#e6f7ff' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#333',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        background: '#1890ff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px',
                        marginRight: '8px'
                      }}>
                        {index + 1}
                      </span>
                      路线 {index + 1}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    lineHeight: 1.4
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#1890ff', fontWeight: 500 }}>
                        {formatDistance(route.distance)}
                      </span>
                      <span style={{ color: '#52c41a', fontWeight: 500 }}>
                        {formatTime(route.time)}
                      </span>
                      <span>{route.tolls ? '收费' : '免费'}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 路线详情 */}
              {showRouteDetails && selectedRoute !== null && routeResults.routes[selectedRoute] && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>路线 {selectedRoute + 1} 详情</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button 
                        type="text" 
                        size="small"
                        onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                        style={{ 
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={isDetailsExpanded ? "收起详情" : "展开详情"}
                      >
                        <span style={{ 
                          fontSize: '12px',
                          transform: isDetailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>▼</span>
                        {isDetailsExpanded ? '收起' : '展开'}
                      </Button>
                      <Button 
                        type="text" 
                        size="small"
                        onClick={() => setShowRouteDetails(false)}
                        style={{ color: '#ff4d4f' }}
                        title="关闭详情"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  
                  {isDetailsExpanded && (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ color: '#666' }}>总距离:</span>
                          <span style={{ fontWeight: 500, color: '#1890ff' }}>
                            {formatDistance(routeResults.routes[selectedRoute].distance)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ color: '#666' }}>预计时间:</span>
                          <span style={{ fontWeight: 500, color: '#52c41a' }}>
                            {formatTime(routeResults.routes[selectedRoute].time)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ color: '#666' }}>收费情况:</span>
                          <span style={{ fontWeight: 500, color: routeResults.routes[selectedRoute].tolls ? '#ff4d4f' : '#52c41a' }}>
                            {routeResults.routes[selectedRoute].tolls ? '收费' : '免费'}
                          </span>
                        </div>
                      </div>

                      {/* 路线步骤 */}
                      {routeResults.routes[selectedRoute].steps && (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '10px' }}>
                            路线步骤:
                          </div>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {routeResults.routes[selectedRoute].steps.map((step: any, stepIndex: number) => (
                              <div key={stepIndex} style={{
                                padding: '8px 12px',
                                marginBottom: '5px',
                                background: 'white',
                                borderRadius: '4px',
                                border: '1px solid #e9ecef',
                                fontSize: '12px',
                                lineHeight: 1.4
                              }}>
                                <div style={{ color: '#333', marginBottom: '2px' }}>
                                  {step.instruction}
                                </div>
                                {step.distance && (
                                  <div style={{ color: '#666', fontSize: '11px' }}>
                                    距离: {formatDistance(step.distance)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
              <div>未找到可行路线</div>
              <div style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
                请检查起点和终点是否正确
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 地图容器 */}
      <div style={{
        flex: 1,
        position: 'relative',
        margin: '20px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        height: 'calc(100vh - 40px)'
      }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            background: mapLoaded ? 'transparent' : '#f5f5f5',
            position: 'relative',
            minHeight: '400px'
          }}
        >
          {!mapLoaded && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#999',
              fontSize: '16px',
              zIndex: 1
            }}>
              地图加载中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutePlanning;
