import React from 'react';
import { Button, Card, Typography, Spin, message } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';
import { AIService, TravelRequest, TravelItinerary } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { travelPlanService } from '../services/supabase';

const { Title, Text } = Typography;

// 读取环境变量中的科大讯飞配置
const XUNFEI_APP_ID = (import.meta as any).env?.VITE_XUNFEI_APP_ID || '';
const XUNFEI_API_KEY = (import.meta as any).env?.VITE_XUNFEI_API_KEY || '';
const XUNFEI_API_SECRET = (import.meta as any).env?.VITE_XUNFEI_API_SECRET || '';

const VoicePlanner: React.FC = () => {
	const navigate = useNavigate();
    const { user } = useAuth();
	const [isRecording, setIsRecording] = React.useState(false);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [statusText, setStatusText] = React.useState('点击麦克风开始录音');
	const [volume, setVolume] = React.useState(0);
	const [resultText, setResultText] = React.useState('');
const [planLoading, setPlanLoading] = React.useState(false);
const [planResult, setPlanResult] = React.useState<TravelItinerary | null>(null);
const [budgetAnalysis, setBudgetAnalysis] = React.useState<{ budgetStatus: 'over' | 'under' | 'on_track'; remainingBudget: number; suggestions: string[] } | null>(null);

	const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
	const audioChunksRef = React.useRef<Blob[]>([]);
	const websocketRef = React.useRef<WebSocket | null>(null);
	const audioContextRef = React.useRef<AudioContext | null>(null);
	const analyserRef = React.useRef<AnalyserNode | null>(null);
	const streamRef = React.useRef<MediaStream | null>(null);
	const rafRef = React.useRef<number | null>(null);

React.useEffect(() => {}, []);

	const startRecording = async () => {
		if (!XUNFEI_APP_ID || !XUNFEI_API_KEY || !XUNFEI_API_SECRET) {
			message.warning('请先在环境变量中配置 VITE_XUNFEI_APP_ID / VITE_XUNFEI_API_KEY / VITE_XUNFEI_API_SECRET');
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false
				}
			});

			streamRef.current = stream;

			let mimeType = 'audio/webm;codecs=opus';
			if (MediaRecorder.isTypeSupported('audio/wav')) mimeType = 'audio/wav';
			else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';

			const mr = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = mr;
			audioChunksRef.current = [];

			mr.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunksRef.current.push(e.data);
			};
			mr.onstop = () => {
				stream.getTracks().forEach(t => t.stop());
				processAudio();
			};

			mr.start();
			setIsRecording(true);
			setStatusText('正在录音中...');
			setResultText('');
			startVolumeMeter(stream);
		} catch (e: any) {
			setStatusText(`无法访问麦克风：${e?.message || '未知错误'}`);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			setStatusText('录音已停止，正在处理...');
			stopVolumeMeter();
		}
	};

	const startVolumeMeter = (stream: MediaStream) => {
		const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
		const analyser = ac.createAnalyser();
		const mic = ac.createMediaStreamSource(stream);
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.8;
		mic.connect(analyser);
		audioContextRef.current = ac;
		analyserRef.current = analyser;
		const arr = new Uint8Array(analyser.frequencyBinCount);
		const tick = () => {
			analyser.getByteFrequencyData(arr);
			let sum = 0;
			for (let i = 0; i < arr.length; i++) sum += arr[i];
			const avg = sum / arr.length;
			setVolume((avg / 255) * 100);
			rafRef.current = requestAnimationFrame(tick);
		};
		tick();
	};

	const stopVolumeMeter = () => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = null;
		if (audioContextRef.current) audioContextRef.current.close();
		audioContextRef.current = null;
		setVolume(0);
	};

	const processAudio = async () => {
		try {
			setIsProcessing(true);
			setStatusText('正在识别中...');
			const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
			const buf = await blob.arrayBuffer();
			const pcm = await toPCM16kMono(buf);
			if (!pcm.length) {
				setStatusText('音频数据为空，请重试');
				return;
			}
			await callIAT(pcm);
		} catch (e: any) {
			setStatusText(`音频处理失败：${e?.message || '未知错误'}`);
		} finally {
			setIsProcessing(false);
		}
	};

	const toPCM16kMono = async (audioBuffer: ArrayBuffer): Promise<Int16Array> => {
		return new Promise((resolve, reject) => {
			const ac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
			ac.decodeAudioData(audioBuffer)
				.then(decoded => {
					const left = decoded.getChannelData(0);
					const out = new Int16Array(left.length);
					let sum = 0;
					for (let i = 0; i < left.length; i++) sum += Math.abs(left[i]);
					const avg = sum / left.length;
					let gain = 1;
					if (avg < 0.01) gain = 100; else if (avg < 0.1) gain = 10;
					for (let i = 0; i < left.length; i++) {
						let s = left[i] * gain;
						s = Math.max(-1, Math.min(1, s));
						out[i] = s * 0x7fff;
					}
					resolve(out);
				})
				.catch(reject);
		});
	};

// 去除AI请求的解析函数

	const callIAT = async (pcmData: Int16Array) => {
		return new Promise<void>((resolve, reject) => {
			const host = 'wss://iat-api.xfyun.cn/v2/iat';
			const date = new Date().toGMTString();
			const signatureOrigin = `host: iat-api.xfyun.cn\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
			const sha = CryptoJS.HmacSHA256(signatureOrigin, XUNFEI_API_SECRET);
			const signature = CryptoJS.enc.Base64.stringify(sha);
			const authorizationOrigin = `api_key="${XUNFEI_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
			const authorization = btoa(authorizationOrigin);
			const url = `${host}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=iat-api.xfyun.cn`;

			const ws = new WebSocket(url);
			websocketRef.current = ws;
			setResultText('');

			ws.onopen = () => {
				const startFrame = {
					common: { app_id: XUNFEI_APP_ID },
					business: { language: 'zh_cn', domain: 'iat', accent: 'mandarin' },
					data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' }
				};
				ws.send(JSON.stringify(startFrame));
				const chunkSize = 1280;
				const audio = new Uint8Array(pcmData.buffer);
				let offset = 0;
				const sendNext = () => {
					if (offset < audio.length) {
						const chunk = audio.slice(offset, Math.min(offset + chunkSize, audio.length));
						const base64 = toBase64(chunk.buffer);
						ws.send(JSON.stringify({ data: { status: 1, format: 'audio/L16;rate=16000', encoding: 'raw', audio: base64 } }));
						offset += chunkSize;
						setTimeout(sendNext, 40);
					} else {
						ws.send(JSON.stringify({ data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } }));
					}
				};
				setTimeout(sendNext, 100);
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.code === 0 && data.data?.result?.ws) {
						let text = '';
						for (const w of data.data.result.ws) {
							if (Array.isArray(w.cw)) {
								for (const c of w.cw) if (c.w && c.w.trim()) text += c.w;
							}
						}
						if (text) setResultText(prev => prev + text);
						setStatusText(data.data.status === 2 ? '识别完成' : '正在识别中...');
					} else if (data.code !== 0) {
						setStatusText(`API错误: ${data.code} - ${data.message}`);
					}
				} catch {
					setStatusText('解析响应失败');
				}
			};

			ws.onerror = (e) => {
				setStatusText('连接失败，请检查网络和API配置');
				reject(e);
			};
			ws.onclose = () => resolve();
		});
	};

	const toBase64 = (buffer: ArrayBuffer) => {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	};

	// 将识别文本解析为 TravelRequest（与文字规划页一致的简化规则）
	const parseFromText = (input: string): TravelRequest => {
		const destinationMatch = input.match(/(?:去|到|前往)([^，,。！!？?]+)/);
		const durationMatch = input.match(/(\d+)天/);
		const budgetMatch = input.match(/(\d+)(?:元|万|千)/);
		const destination = destinationMatch ? destinationMatch[1].trim() : '未知目的地';
		const duration = durationMatch ? parseInt(durationMatch[1]) : 5;
		let budget = 10000;
		if (budgetMatch) {
			budget = parseInt(budgetMatch[1]) * (budgetMatch[0].includes('万') ? 10000 : budgetMatch[0].includes('千') ? 1000 : 1);
		}
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

	React.useEffect(() => {
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			if (audioContextRef.current) audioContextRef.current.close();
			if (websocketRef.current) websocketRef.current.close();
			if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
		};
	}, []);

	return (
		<div style={{ padding: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', color: 'white' }}>
            <div style={{ marginBottom: '24px' }}>
				<Title level={2} style={{ color: 'white', marginBottom: 0 }}>🎤 语音规划</Title>
				<Text style={{ color: 'rgba(255,255,255,0.85)' }}>点击麦克风开始/结束录音，自动转文字</Text>
			</div>
			<div style={{ marginBottom: '16px' }}>
				<Button onClick={() => navigate('/dashboard')}>← 返回首页</Button>
			</div>
			<Card className="travel-card">
				<div style={{ textAlign: 'center' }}>
					<Button
						type="primary"
						shape="circle"
						size="large"
						icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
						onClick={isRecording ? stopRecording : startRecording}
						loading={isProcessing}
						style={{
							width: 80,
							height: 80,
							fontSize: 28,
							background: isRecording ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' : 'linear-gradient(45deg, #667eea, #764ba2)',
							border: 'none'
						}}
					/>
					<div style={{ marginTop: 12 }}>
						<Text style={{ color: '#666' }}>{statusText}</Text>
					</div>
					{isRecording && (
						<div style={{ marginTop: 12 }}>
							<Text style={{ color: '#666' }}>录音音量：{volume.toFixed(1)}%</Text>
							<div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden', marginTop: 6, width: 220, marginInline: 'auto' }}>
								<div style={{ height: '100%', width: `${volume}%`, background: volume > 20 ? '#52c41a' : volume > 10 ? '#faad14' : '#ff4d4f', transition: 'width .1s' }} />
							</div>
						</div>
					)}
					{isProcessing && (
						<div style={{ marginTop: 16 }}>
							<Spin />
							<div style={{ color: '#667eea', marginTop: 8 }}>正在识别语音...</div>
						</div>
					)}
				</div>
				<div style={{ marginTop: 16, background: '#f8f9fa', borderRadius: 8, padding: 16 }}>
					<Title level={5} style={{ margin: 0 }}>识别结果</Title>
                    <div style={{ color: '#333', marginTop: 8, minHeight: 60, whiteSpace: 'pre-wrap' }}>{resultText || '—— 识别结果将显示在这里 ——'}</div>
                    <div style={{ marginTop: 12 }}>
                        <Button
                            type="primary"
                            disabled={!resultText.trim()}
                            loading={planLoading}
                            onClick={async () => {
                                if (!resultText.trim()) return;
                                try {
                                    setPlanLoading(true);
                                    const request: TravelRequest = parseFromText(resultText);
                                    const ai = new AIService(
                                        (import.meta as any).env?.VITE_ALIBABA_ACCESS_KEY_ID ?? '',
                                        (import.meta as any).env?.VITE_ALIBABA_ACCESS_KEY_SECRET ?? '',
                                        (import.meta as any).env?.VITE_DASHSCOPE_API_KEY ?? ''
                                    );
                                    let plan = await ai.generateTravelPlan(request);
                                    // 强制以用户输入为准：覆盖AI返回的预算
                                    plan = { ...plan, budget: request.budget };
                                    setPlanResult(plan);
                                    try {
                                        const analysis = await ai.analyzeBudget(plan, [plan.totalEstimatedCost || 0]);
                                        setBudgetAnalysis(analysis);
                                    } catch {}
                                    message.success('旅行计划生成完成');
                                } catch (err) {
                                    console.error(err);
                                    message.error('生成旅行计划失败');
                                } finally {
                                    setPlanLoading(false);
                                }
                            }}
                        >
                            🚀 生成旅行计划
                        </Button>
                        {planResult && user && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={async () => {
                                        try {
                                            await travelPlanService.createPlan({
                                                user_id: user.id,
                                                title: `${planResult.destination} ${planResult.duration}日游`,
                                                destination: planResult.destination,
                                                start_date: planResult.days[0]?.date || '',
                                                end_date: planResult.days[planResult.days.length - 1]?.date || '',
                                                budget: planResult.budget,
                                                travelers: planResult.travelers,
                                                preferences: planResult.preferences,
                                                itinerary: planResult
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
                        )}
                    </div>
				</div>
			</Card>
            {planResult && (
                <Card className="travel-card" style={{ marginTop: 16 }}>
                    <Title level={4} style={{ marginBottom: 12 }}>📋 旅行计划</Title>
                    <div style={{ color: '#333' }}>
                        <div style={{ marginBottom: 8 }}><Text strong>目的地：</Text>{planResult.destination}</div>
                        <div style={{ marginBottom: 8 }}><Text strong>时长：</Text>{planResult.duration} 天</div>
                        <div style={{ marginBottom: 8 }}><Text strong>预算：</Text>¥{planResult.budget}</div>
                        <div style={{ marginBottom: 8 }}><Text strong>偏好：</Text>{planResult.preferences}</div>
                        <div style={{ marginTop: 12 }}>
                            <Title level={5} style={{ margin: 0 }}>每日安排</Title>
                            <div style={{ marginTop: 8 }}>
                                {planResult.days.map((day, i) => (
                                    <div key={i} style={{ marginBottom: 12, background: '#f6f7fb', borderRadius: 8, padding: 12 }}>
                                        <div style={{ color: '#667eea', fontWeight: 600 }}>第{i + 1}天 - {day.date}</div>
                                        <div style={{ marginTop: 6 }}>
                                            {day.activities.map((act, j) => (
                                                <div key={j} style={{ marginLeft: 8 }}>
                                                    <span style={{ marginRight: 8, color: '#666' }}>{act.time}</span>
                                                    <span style={{ fontWeight: 500 }}>{act.activity}</span>
                                                    <span style={{ marginLeft: 8, color: '#999' }}>{act.location}</span>
                                                    <span style={{ marginLeft: 8, color: '#52c41a' }}>¥{act.estimatedCost}</span>
                                                    <div style={{ color: '#555' }}>{act.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <Text strong>总预估费用：</Text>¥{planResult.totalEstimatedCost}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <Title level={5} style={{ margin: 0 }}>建议</Title>
                                <ul style={{ marginTop: 6 }}>
                                    {planResult.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {budgetAnalysis && planResult && (
                <Card className="travel-card" style={{ marginTop: 16 }}>
                    <div style={{ color: '#333' }}>
                        <Title level={4} style={{ marginBottom: 12, color: '#333' }}>💰 预算分析</Title>
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
                    </div>
                </Card>
            )}


		</div>
	);
};

export default VoicePlanner;


