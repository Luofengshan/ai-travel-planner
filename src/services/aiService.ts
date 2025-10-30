export interface TravelRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  preferences: string;
}

export interface DayPlan {
  date: string;
  activities: Array<{
    time: string;
    activity: string;
    location: string;
    description: string;
    estimatedCost: number;
  }>;
}

export interface TravelItinerary {
  destination: string;
  duration: number;
  budget: number;
  travelers: number;
  preferences: string;
  days: DayPlan[];
  totalEstimatedCost: number;
  recommendations: string[];
  isAIGenerated?: boolean; // 标识是否为AI生成
  source?: string; // 数据来源标识
}

export class AIService {
  constructor(accessKeyId: string, accessKeySecret: string, dashscopeApiKey: string) {
    // 参数保留用于未来扩展
    console.log('AIService initialized with keys');
  }

  // 生成旅行计划
  async generateTravelPlan(request: TravelRequest): Promise<TravelItinerary> {
    console.log('🎯 开始生成旅行计划:', request);
    
    try {
      // 调用真实的阿里云DashScope API
      console.log('🤖 正在调用阿里云DashScope API...');
      const response = await this.callDashScopeAPI(request);
      console.log('✅ 成功获得AI生成的旅行计划');
      return this.ensureCosts(response);
    } catch (error) {
      console.error('❌ 阿里云API调用失败，使用智能模拟数据:', error);
      console.log('🔄 切换到智能模拟数据模式...');
      // 如果API调用失败，使用智能模拟数据作为备用
      const mockResponse = this.generateSmartMockPlan(request);
      console.log('📝 使用模拟数据生成完成');
      return this.ensureCosts(mockResponse);
    }
  }

  private buildTravelPrompt(request: TravelRequest): string {
    return `你是一名专业旅行规划师。为如下需求生成详细旅行计划，并且务必给出清晰的费用估算：

目的地：${request.destination}
出发日期：${request.startDate}
返回日期：${request.endDate}
总预算（上限，CNY）：${request.budget}
同行人数：${request.travelers}
旅行偏好：${request.preferences}

输出要求（必须全部满足）：
1) 每个 activities 项必须包含数值型 estimatedCost（CNY，数字类型，不要字符串）。
2) 如果无法精确价格，请给出合理估算，不能留空或为 null。
3) 计算并返回 totalEstimatedCost（所有天数的 estimatedCost 之和，CNY）。
4) 保持花费估算不超过总预算的合理范围，尽量贴合预算。
5) 仅返回合法 JSON，不要包含任何 markdown 标记或额外文本。

严格按以下 JSON 结构返回（字段名与类型必须一致）：
{
  "destination": "${request.destination}",
  "duration": 整数天数,
  "budget": ${request.budget},
  "travelers": ${request.travelers},
  "preferences": "${request.preferences}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "HH:MM",
          "activity": "活动名称",
          "location": "地点",
          "description": "简要描述",
          "estimatedCost": 数字
        }
      ]
    }
  ],
  "totalEstimatedCost": 数字,
  "recommendations": ["建议1", "建议2", "建议3"]
}`;
  }

  private async callDashScopeAPI(request: TravelRequest): Promise<TravelItinerary> {
    const apiKey = (import.meta as any).env?.VITE_DASHSCOPE_API_KEY || 'sk-8608f83299f24a1c838967a928907041';
    
    if (!apiKey) {
      console.warn('⚠️ DashScope API Key未配置，使用模拟响应');
      throw new Error('API Key未配置');
    }

    const prompt = this.buildTravelPrompt(request);
    console.log('📤 发送到阿里云API的提示:', prompt);

    try {
      // 使用后端代理服务器避免CORS问题
      const response = await fetch('http://localhost:3001/api/dashscope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`代理服务器调用失败: ${response.status}`, errorText);
        throw new Error(`代理服务器调用失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 阿里云API响应:', data);
      
      if (data.output && data.output.choices && data.output.choices[0]) {
        const aiResponse = data.output.choices[0].message.content;
        console.log('🎉 AI生成的旅行计划内容:', aiResponse);
        
        // 解析AI返回的JSON格式旅行计划
        let result = this.parseTravelResponse(aiResponse);
        result = this.ensureCosts(result);
        result.isAIGenerated = true;
        result.source = '阿里云DashScope API';
        console.log('✅ 标记为AI生成结果');
        return result;
      } else {
        console.error('API响应格式错误:', data);
        throw new Error('API响应格式错误');
      }
    } catch (error) {
      console.error('阿里云DashScope API调用失败:', error);
      throw error;
    }
  }

  private getMockResponse(): string {
    // 生成更个性化的模拟数据
    const destinations = ['日本东京', '韩国首尔', '泰国曼谷', '新加坡', '马来西亚吉隆坡'];
    const activities = [
      { time: "09:00", activity: "早餐", location: "酒店餐厅", description: "享用酒店早餐", cost: 50 },
      { time: "10:30", activity: "景点游览", location: "主要景点", description: "参观当地著名景点", cost: 200 },
      { time: "12:00", activity: "午餐", location: "当地餐厅", description: "品尝当地美食", cost: 150 },
      { time: "14:00", activity: "购物", location: "商业区", description: "购买纪念品", cost: 300 },
      { time: "18:00", activity: "晚餐", location: "特色餐厅", description: "享用晚餐", cost: 250 }
    ];
    
    const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];
    const randomDays = Math.floor(Math.random() * 3) + 3; // 3-5天
    
    const days = [];
    for (let i = 0; i < randomDays; i++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + i);
      
      days.push({
        date: currentDate.toISOString().split('T')[0],
        activities: activities.map(activity => ({
          ...activity,
          estimatedCost: activity.cost
        }))
      });
    }
    
    const totalCost = activities.reduce((sum, activity) => sum + activity.cost, 0) * randomDays;
    
    return JSON.stringify({
      destination: randomDestination,
      duration: randomDays,
      budget: totalCost * 1.2,
      travelers: 1,
      preferences: "个性化旅行",
      days: days,
      totalEstimatedCost: totalCost,
      recommendations: [
        "建议提前预订酒店和机票",
        "注意当地天气情况，准备合适的衣物",
        "了解当地文化和习俗",
        "准备必要的旅行证件"
      ]
    });
  }

  private parseTravelResponse(response: string): TravelItinerary {
    try {
      // 清理markdown格式标记
      let cleanResponse = response.trim();
      
      // 移除 ```json 和 ``` 标记
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '');
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.replace(/\s*```$/, '');
      }
      
      // 移除可能的其他markdown标记
      cleanResponse = cleanResponse.replace(/^```.*$/gm, '').trim();
      
      // 尝试提取JSON部分
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      console.log('清理后的响应:', cleanResponse);
      
      const data = JSON.parse(cleanResponse);
      return {
        destination: data.destination || '',
        duration: data.days?.length || 1,
        budget: data.budget || 0,
        travelers: data.travelers || 1,
        preferences: data.preferences || '',
        days: data.days || [],
        totalEstimatedCost: data.totalEstimatedCost || 0,
        recommendations: data.recommendations || []
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      console.error('原始响应:', response);
      
      // 如果JSON解析失败，尝试从响应中提取关键信息
      return this.extractInfoFromText(response);
    }
  }

  private ensureCosts(itinerary: TravelItinerary): TravelItinerary {
    const travelers = Math.max(1, Number(itinerary.travelers) || 1);
    const daysArray = Array.isArray(itinerary.days) ? itinerary.days : [];

    // 预算强度估计（用于住宿档位）
    const nights = Math.max(1, daysArray.length - 1);
    const budgetTotal = Number(itinerary.budget) || 0;
    const budgetPerNight = nights > 0 ? budgetTotal / nights : budgetTotal;
    const budgetLevel = budgetPerNight >= 600 ? 'high' : budgetPerNight >= 350 ? 'medium' : 'low';
    const perRoomNight = budgetLevel === 'high' ? 600 : budgetLevel === 'medium' ? 350 : 200;
    const roomsNeeded = Math.max(1, Math.ceil(travelers / 2));

    const mealCosts = { breakfast: 30, lunch: 60, dinner: 80 };

    const enrichedDays = daysArray.map((day, idx) => {
      const acts = Array.isArray(day.activities) ? [...day.activities] : [];

      // 标准化已有费用
      for (let i = 0; i < acts.length; i++) {
        let cost = Number((acts[i] as any).estimatedCost);
        if (!isFinite(cost) || cost < 0) {
          const name = `${acts[i].activity || ''} ${acts[i].description || ''}`;
          if (/早|早餐|早饭/.test(name)) cost = mealCosts.breakfast * travelers;
          else if (/午|午餐|午饭|中餐/.test(name)) cost = mealCosts.lunch * travelers;
          else if (/晚|晚餐|晚饭|夜宵/.test(name)) cost = mealCosts.dinner * travelers;
          else if (/住|住宿|酒店|民宿|客栈/.test(name)) cost = perRoomNight * roomsNeeded;
          else if (/门票|景点|博物|美术|展|塔|登顶/.test(name)) cost = 80 * travelers;
          else if (/交通|地铁|打车|出租|巴士|公交|高铁|火车|飞机/.test(name)) cost = 40 * travelers;
          else if (/购物|夜市|特产|纪念/.test(name)) cost = 150 * travelers;
          else cost = 100 * travelers;
        }
        acts[i] = { ...acts[i], estimatedCost: Math.round(cost) };
      }

      const textOfDay = acts.map(a => `${a.activity || ''} ${a.description || ''}`).join(' ');
      const hasBreakfast = /早|早餐|早饭/.test(textOfDay);
      const hasLunch = /午|午餐|午饭|中餐/.test(textOfDay);
      const hasDinner = /晚|晚餐|晚饭|夜宵/.test(textOfDay);
      const hasLodging = /住|住宿|酒店|民宿|客栈/.test(textOfDay);

      // 自动补全三餐
      if (!hasBreakfast) {
        acts.push({
          time: '08:00',
          activity: '早餐',
          location: '酒店/附近餐厅',
          description: '简餐/当地早餐',
          estimatedCost: mealCosts.breakfast * travelers
        } as any);
      }
      if (!hasLunch) {
        acts.push({
          time: '12:00',
          activity: '午餐',
          location: '当地餐厅',
          description: '特色简餐',
          estimatedCost: mealCosts.lunch * travelers
        } as any);
      }
      if (!hasDinner) {
        acts.push({
          time: '18:00',
          activity: '晚餐',
          location: '特色餐厅',
          description: '当地特色菜',
          estimatedCost: mealCosts.dinner * travelers
        } as any);
      }

      // 自动补住宿：除最后一天外
      if (idx < daysArray.length - 1 && !hasLodging) {
        acts.push({
          time: '22:00',
          activity: '住宿',
          location: '市区酒店/民宿',
          description: `预计 ${roomsNeeded} 间 · ${budgetLevel === 'high' ? '高档' : budgetLevel === 'medium' ? '舒适' : '经济'}`,
          estimatedCost: perRoomNight * roomsNeeded
        } as any);
      }

      return { ...day, activities: acts };
    });

    const total = enrichedDays.reduce((sum, day) =>
      sum + day.activities.reduce((s, a) => s + (Number((a as any).estimatedCost) || 0), 0)
    , 0);

    const result: TravelItinerary = {
      ...itinerary,
      days: enrichedDays,
      totalEstimatedCost: isFinite(total) ? Math.round(total) : 0,
      budget: isFinite(Number(itinerary.budget)) ? itinerary.budget : Math.round(total)
    };

    return result;
  }

  private extractInfoFromText(response: string): TravelItinerary {
    // 从文本中提取关键信息的备用方法
    console.log('使用文本提取方法处理响应');
    
    // 尝试提取目的地
    const destinationMatch = response.match(/目的地[：:]\s*([^\n\r,，]+)/);
    const destination = destinationMatch ? destinationMatch[1].trim() : '未知目的地';
    
    // 生成基本的旅行计划结构
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 3);
    
    return {
      destination: destination,
      duration: 3,
      budget: 5000,
      travelers: 1,
      preferences: 'AI生成的个性化旅行',
      days: [
        {
          date: startDate.toISOString().split('T')[0],
          activities: [
            {
              time: "09:00",
              activity: "早餐",
              location: "酒店",
              description: "享用当地特色早餐",
              estimatedCost: 50
            },
            {
              time: "10:00",
              activity: "景点游览",
              location: "主要景点",
              description: "参观当地著名景点",
              estimatedCost: 200
            },
            {
              time: "14:00",
              activity: "午餐",
              location: "当地餐厅",
              description: "品尝当地美食",
              estimatedCost: 150
            },
            {
              time: "18:00",
              activity: "晚餐",
              location: "特色餐厅",
              description: "享用晚餐",
              estimatedCost: 250
            }
          ]
        }
      ],
      totalEstimatedCost: 650,
      recommendations: [
        "建议提前预订酒店和交通",
        "注意当地天气情况",
        "了解当地文化和习俗",
        "准备必要的旅行证件"
      ]
    };
  }

  private generateSmartMockPlan(request: TravelRequest): TravelItinerary {
    const destination = request.destination;
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 根据目的地生成不同的活动
    const activitiesByDestination = {
      '北京': [
        { time: "08:00", activity: "天安门广场", location: "天安门广场", description: "观看升旗仪式，感受庄严氛围", cost: 0 },
        { time: "10:00", activity: "故宫博物院", location: "故宫", description: "参观明清两代皇宫，了解历史文化", cost: 60 },
        { time: "14:00", activity: "颐和园", location: "颐和园", description: "游览皇家园林，欣赏湖光山色", cost: 30 },
        { time: "18:00", activity: "王府井", location: "王府井大街", description: "品尝北京小吃，购买纪念品", cost: 150 }
      ],
      '上海': [
        { time: "09:00", activity: "外滩", location: "外滩", description: "欣赏黄浦江两岸风光", cost: 0 },
        { time: "11:00", activity: "东方明珠", location: "陆家嘴", description: "登塔俯瞰上海全景", cost: 160 },
        { time: "14:00", activity: "南京路", location: "南京路步行街", description: "购物和品尝美食", cost: 200 },
        { time: "19:00", activity: "新天地", location: "新天地", description: "体验上海夜生活", cost: 300 }
      ],
      '杭州': [
        { time: "08:00", activity: "西湖", location: "西湖", description: "漫步苏堤，欣赏西湖美景", cost: 0 },
        { time: "10:30", activity: "雷峰塔", location: "雷峰塔", description: "登塔俯瞰西湖全景", cost: 40 },
        { time: "14:00", activity: "灵隐寺", location: "灵隐寺", description: "参拜古刹，感受佛教文化", cost: 45 },
        { time: "16:30", activity: "河坊街", location: "河坊街", description: "体验杭州传统文化", cost: 100 }
      ]
    };
    
    // 根据预算调整活动
    const budgetLevel = request.budget > 5000 ? 'high' : request.budget > 2000 ? 'medium' : 'low';
    const baseActivities = activitiesByDestination[destination] || activitiesByDestination['北京'];
    
    const days = [];
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // 根据预算调整每日活动
      const dailyActivities = baseActivities.map(activity => ({
        ...activity,
        estimatedCost: budgetLevel === 'high' ? activity.cost * 1.5 : 
                      budgetLevel === 'low' ? activity.cost * 0.7 : activity.cost
      }));
      
      days.push({
        date: currentDate.toISOString().split('T')[0],
        activities: dailyActivities
      });
    }
    
    const totalCost = days.reduce((sum, day) => 
      sum + day.activities.reduce((daySum, activity) => daySum + activity.estimatedCost, 0), 0
    );
    
    // 根据目的地生成个性化建议
    const recommendations = this.getDestinationRecommendations(destination, budgetLevel);
    
    const result = {
      destination: request.destination,
      duration,
      budget: request.budget,
      travelers: request.travelers,
      preferences: request.preferences,
      days,
      totalEstimatedCost: totalCost,
      recommendations,
      isAIGenerated: false,
      source: '智能模拟数据'
    };
    console.log('📝 标记为模拟数据结果');
    return result;
  }

  private getDestinationRecommendations(destination: string, budgetLevel: string): string[] {
    const baseRecommendations = [
      "建议提前预订酒店和交通",
      "注意当地天气情况，准备合适的衣物",
      "了解当地文化和习俗",
      "准备必要的旅行证件"
    ];
    
    const destinationSpecific = {
      '北京': [
        "建议购买北京一卡通，方便乘坐公共交通",
        "故宫需要提前预约，建议网上购票",
        "注意北京的空气质量，准备口罩"
      ],
      '上海': [
        "建议购买上海交通卡",
        "外滩夜景很美，建议晚上前往",
        "注意上海的交通拥堵，合理安排时间"
      ],
      '杭州': [
        "西湖景区很大，建议租借自行车",
        "春季是杭州最美的时候",
        "注意保护环境，不要乱扔垃圾"
      ]
    };
    
    return [...baseRecommendations, ...(destinationSpecific[destination] || [])];
  }

  private generateDefaultPlan(request: TravelRequest): TravelItinerary {
    const days = [];
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      days.push({
        date: currentDate.toISOString().split('T')[0],
        activities: [
          {
            time: "09:00",
            activity: "早餐",
            location: "酒店餐厅",
            description: "享用酒店早餐",
            estimatedCost: 50
          },
          {
            time: "10:00",
            activity: "景点游览",
            location: "主要景点",
            description: "参观当地著名景点",
            estimatedCost: 200
          },
          {
            time: "12:00",
            activity: "午餐",
            location: "当地餐厅",
            description: "品尝当地美食",
            estimatedCost: 150
          },
          {
            time: "14:00",
            activity: "自由活动",
            location: "市区",
            description: "自由购物或休息",
            estimatedCost: 100
          },
          {
            time: "18:00",
            activity: "晚餐",
            location: "特色餐厅",
            description: "享用晚餐",
            estimatedCost: 200
          }
        ]
      });
    }

    return {
      destination: request.destination,
      duration,
      budget: request.budget,
      travelers: request.travelers,
      preferences: request.preferences,
      days,
      totalEstimatedCost: request.budget * 0.8, // 预估使用80%预算
      recommendations: [
        "建议提前预订酒店和机票",
        "注意当地天气情况，准备合适的衣物",
        "了解当地文化和习俗",
        "准备必要的旅行证件"
      ]
    };
  }

  // 预算分析
  async analyzeBudget(itinerary: TravelItinerary, actualExpenses: number[]): Promise<{
    budgetStatus: 'over' | 'under' | 'on_track';
    remainingBudget: number;
    suggestions: string[];
  }> {
    const totalActual = actualExpenses.reduce((sum, expense) => sum + expense, 0);
    const remaining = itinerary.budget - totalActual;
    
    let budgetStatus: 'over' | 'under' | 'on_track' = 'on_track';
    if (remaining < 0) budgetStatus = 'over';
    else if (remaining > itinerary.budget * 0.3) budgetStatus = 'under';

    const suggestions = [];
    if (budgetStatus === 'over') {
      suggestions.push('预算超支，建议减少非必要支出');
      suggestions.push('考虑选择更经济的住宿和餐饮选项');
    } else if (budgetStatus === 'under') {
      suggestions.push('预算充足，可以考虑增加一些体验活动');
      suggestions.push('可以升级住宿或餐饮选择');
    }

    return {
      budgetStatus,
      remainingBudget: remaining,
      suggestions
    };
  }
}

