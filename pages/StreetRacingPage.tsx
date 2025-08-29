import React, { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { RECIPIENT_WALLET_ADDRESS, ICONS } from '../constants';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

// Declare Three.js and the ad SDK to be globally available from the scripts in index.html
declare const THREE: any;
declare const show_9692552: (type?: 'pop') => Promise<void>;

const StreetRacingPage: React.FC<{ user: User | null; setUser: Dispatch<SetStateAction<User | null>> }> = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    // Refs for DOM elements and stable game objects
    const gameRendererRef = useRef<HTMLDivElement>(null);
    const gameLoopId = useRef<number | null>(null);
    const keys = useRef<{ [key: string]: boolean }>({});
    const game = useRef<any>(null); // To hold all game variables and methods

    // React state for UI changes
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isGarageVisible, setGarageVisible] = useState(false);
    const [isRacingUI, setRacingUI] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [uiData, setUiData] = useState({
        tonBalance: 0,
        careerPoints: 0,
        speed: 0,
        nitro: 100,
        position: '1/4',
        time: '0:00',
        points: 0,
        progress: 0,
    });
    const [garageData, setGarageData] = useState({
        selectedCarIndex: 0,
        speed: 0, accel: 0, handling: 0, nitro: 0,
    });

    // Show notifications and clear them
    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    // Main game logic effect
    useEffect(() => {
        if (!user || typeof THREE === 'undefined') return;

        // --- GAME INITIALIZATION ---
        const initGame = () => {
            const carDefs = [
                { name: "Street Starter", emoji: "🚗", base: { s: 70, a: 60, h: 80, n: 50 }, cost: 0 },
                { name: "Speed Demon", emoji: "🏎️", base: { s: 85, a: 75, h: 70, n: 80 }, cost: 0.20 },
                { name: "Drift King", emoji: "🚙", base: { s: 75, a: 80, h: 95, n: 70 }, cost: 0.15 },
                { name: "Nitro Beast", emoji: "🏁", base: { s: 80, a: 85, h: 75, n: 100 }, cost: 0.30 },
                { name: "Super GT", emoji: "🚘", base: { s: 95, a: 90, h: 85, n: 85 }, cost: 0.50 }
            ];

            const upgradeDefs = {
                engine: { cost: 0.08, ads: 15 },
                tires: { cost: 0.05, ads: 10 },
                nitro: { cost: 0.12, ads: 20 },
            };
            
            let scene: any, camera: any, renderer: any, playerCar: any, track: any, opponents: any[] = [], clock: any;

            let playerSpeed = 0, isNitroActive = false, raceStartTime = 0, raceProgress = 0, nitroLevel = 100;
            let raceDistance = 1000;
            let isRacing = false;

            // Scene setup
            const container = gameRendererRef.current!;
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x000b1a, 100, 500); // Themed fog
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, container.clientHeight);
            renderer.setClearColor(0x0a192f); // Dark blue-slate background
            container.appendChild(renderer.domElement);
            clock = new THREE.Clock();

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(50, 50, 0);
            scene.add(directionalLight);

            // Create track
            const trackGeometry = new THREE.PlaneGeometry(30, raceDistance * 2);
            const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x334155 }); // Slate color
            track = new THREE.Mesh(trackGeometry, trackMaterial);
            track.rotation.x = -Math.PI / 2;
            scene.add(track);

            // Create player car
            const carGeometry = new THREE.BoxGeometry(2, 1, 4);
            const carMaterial = new THREE.MeshLambertMaterial({ color: 0x22c55e }); // Themed green
            playerCar = new THREE.Mesh(carGeometry, carMaterial);
            playerCar.position.set(0, 0.5, 5);
            scene.add(playerCar);
            camera.position.set(0, 8, 15);
            camera.lookAt(playerCar.position);
            
             // Create opponents
            const createOpponents = () => {
                opponents.forEach(opp => scene.remove(opp));
                opponents = [];
                const colors = [0x9333ea, 0xf59e0b, 0x00ffff]; // Purple, Amber, Cyan
                const positions = [-6, 2, 6];
                for (let i = 0; i < 3; i++) {
                    const opp = new THREE.Mesh(carGeometry, new THREE.MeshLambertMaterial({ color: colors[i] }));
                    opp.position.set(positions[i], 0.5, -10 - Math.random() * 20);
                    (opp as any).speed = 0.8 + Math.random() * 0.4;
                    scene.add(opp);
                    opponents.push(opp);
                }
            }
            createOpponents();
            
            const getCarStats = (carIndex: number) => {
                const car = carDefs[carIndex];
                const upgrades = user.streetRacingProgress.carUpgrades[carIndex] || { speed: 0, acceleration: 0, handling: 0, nitro: 0 };
                return {
                    speed: Math.min(100, car.base.s + upgrades.speed * 10),
                    acceleration: Math.min(100, car.base.a + upgrades.acceleration * 10),
                    handling: Math.min(100, car.base.h + upgrades.handling * 15),
                    nitro: Math.min(100, car.base.n + upgrades.nitro * 20),
                };
            };

            const startRace = () => {
                playerCar.position.set(0, 0.5, 5);
                playerSpeed = 0;
                nitroLevel = 100;
                raceProgress = 0;
                createOpponents();
                raceStartTime = clock.getElapsedTime();
                isRacing = true;
                setMenuVisible(false);
                setGarageVisible(false);
                setRacingUI(true);
            };

            const endRace = (position: number) => {
                isRacing = false;
                setRacingUI(false);
                setMenuVisible(true);
                const points = [100, 50, 25, 10][position - 1] || 0;
                showNotification(`Race Finished! Position: ${position}. You earned ${points} career points!`);
                
                setUser(prev => prev ? ({ ...prev, streetRacingProgress: { ...prev.streetRacingProgress, careerPoints: prev.streetRacingProgress.careerPoints + points }}) : null);
            };

            const gameLoop = () => {
                if (!game.current) return;
                gameLoopId.current = requestAnimationFrame(gameLoop);
                const delta = clock.getDelta();
                if (isRacing) {
                    const stats = getCarStats(user.streetRacingProgress.currentCar);
                    
                    // Player movement
                    if (keys.current['KeyA'] || keys.current['ArrowLeft']) playerCar.position.x -= (stats.handling / 100) * 0.5;
                    if (keys.current['KeyD'] || keys.current['ArrowRight']) playerCar.position.x += (stats.handling / 100) * 0.5;
                    playerCar.position.x = THREE.MathUtils.clamp(playerCar.position.x, -12, 12);

                    isNitroActive = (keys.current['Space']) && nitroLevel > 0;
                    if (isNitroActive) {
                        nitroLevel -= 20 * delta;
                        playerSpeed += (stats.acceleration / 100) * delta * 5;
                    } else {
                        nitroLevel = Math.min(100, nitroLevel + 5 * delta);
                        playerSpeed += (stats.acceleration / 100) * delta;
                    }

                    const maxSpeed = (stats.speed / 100) * 80 * (isNitroActive ? 1.5 + (stats.nitro / 100) * 0.5 : 1);
                    playerSpeed = Math.min(maxSpeed, playerSpeed);
                    playerSpeed *= 0.98; // friction

                    playerCar.position.z -= playerSpeed * delta;
                    
                    // Opponent logic
                    opponents.forEach(opp => {
                        opp.position.z -= (opp as any).speed * 40 * delta;
                    });
                    
                    // Camera follow
                    camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerCar.position.x, 0.1);
                    camera.position.z = playerCar.position.z + 10;
                    
                    // Update UI State
                    const elapsedTime = clock.getElapsedTime() - raceStartTime;
                    const minutes = Math.floor(elapsedTime / 60);
                    const seconds = Math.floor(elapsedTime % 60);

                    const playerZ = -playerCar.position.z;
                    raceProgress = Math.min(100, (playerZ / raceDistance) * 100);

                    const allCars = [playerCar, ...opponents].sort((a,b) => b.position.z - a.position.z);
                    const myPosition = allCars.indexOf(playerCar) + 1;
                    
                    setUiData(d => ({
                        ...d,
                        speed: Math.floor(playerSpeed * 2.237), // to MPH
                        nitro: nitroLevel,
                        time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
                        progress: raceProgress,
                        position: `${myPosition}/${allCars.length}`,
                    }));
                    
                    if(raceProgress >= 100) endRace(myPosition);
                }
                renderer.render(scene, camera);
            };
            
            // --- UI Interaction Functions ---
            const showGarage = () => { setMenuVisible(false); setGarageVisible(true); };
            const closeGarage = () => { setGarageVisible(false); setMenuVisible(true); };
            
            const handleUserUpdate = (updater: (prev: User) => User) => {
                 setUser(prev => prev ? updater(prev) : null);
            };
            
            const watchAdForReward = async () => {
                try {
                    await show_9692552();
                    handleUserUpdate(prev => ({ ...prev, ton: prev.ton + 0.01 }));
                    showNotification("You earned 0.01 TON!");
                } catch (e) {
                    console.error("Ad failed or was closed:", e);
                    showNotification("Ad was not completed.");
                }
            };
            
            const buyUpgradeWithTon = async (type: 'engine' | 'tires' | 'nitro') => {
                 if (!wallet) {
                    tonConnectUI.openModal();
                    return;
                }
                const cost = upgradeDefs[type].cost;
                 try {
                     const transaction = {
                         validUntil: Math.floor(Date.now() / 1000) + 60,
                         messages: [{ address: RECIPIENT_WALLET_ADDRESS, amount: (cost * 1e9).toString() }],
                     };
                     
                     const resultBoc = await tonConnectUI.sendTransaction(transaction);
                     if (!resultBoc) {
                         throw new Error("Transaction failed: no response from wallet.");
                     }

                     // Only update state AFTER successful transaction
                     handleUserUpdate(prev => {
                         const carId = prev.streetRacingProgress.currentCar;
                         const upgrades = prev.streetRacingProgress.carUpgrades[carId] || { speed: 0, acceleration: 0, handling: 0, nitro: 0 };
                         if (type === 'engine') { upgrades.speed++; upgrades.acceleration++; }
                         if (type === 'tires') upgrades.handling++;
                         if (type === 'nitro') upgrades.nitro++;
                         
                         return {
                             ...prev,
                             streetRacingProgress: {
                                 ...prev.streetRacingProgress,
                                 carUpgrades: { ...prev.streetRacingProgress.carUpgrades, [carId]: upgrades },
                             }
                         }
                     });
                     showNotification("Upgrade successful!");
                 } catch (e) {
                     showNotification("Transaction failed or rejected.");
                 }
            };

            const watchAdForUpgrade = async (type: 'engine' | 'tires' | 'nitro') => {
                try {
                    await show_9692552();
                    handleUserUpdate(prev => {
                        const progress = { ...prev.streetRacingProgress.adProgress };
                        progress[type]++;
                        
                        if(progress[type] >= upgradeDefs[type].ads) {
                            progress[type] = 0; // Reset progress
                            const carId = prev.streetRacingProgress.currentCar;
                            const upgrades = prev.streetRacingProgress.carUpgrades[carId] || { speed: 0, acceleration: 0, handling: 0, nitro: 0 };
                            if (type === 'engine') { upgrades.speed++; upgrades.acceleration++; }
                            if (type === 'tires') upgrades.handling++;
                            if (type === 'nitro') upgrades.nitro++;
                            showNotification("Upgrade Unlocked!");
                             return {
                                ...prev,
                                streetRacingProgress: {
                                    ...prev.streetRacingProgress,
                                    adProgress: progress,
                                    carUpgrades: { ...prev.streetRacingProgress.carUpgrades, [carId]: upgrades }
                                }
                            };
                        } else {
                            showNotification(`Ad watched! ${progress[type]}/${upgradeDefs[type].ads}`);
                            return { ...prev, streetRacingProgress: { ...prev.streetRacingProgress, adProgress: progress }};
                        }
                    });
                } catch (e) {
                    console.error("Ad failed or was closed:", e);
                    showNotification("Ad was not completed.");
                }
            };
            
             const selectCar = async (carIndex: number) => {
                const car = carDefs[carIndex];
                if (!user.streetRacingProgress.unlockedCars.includes(carIndex)) {
                     if (!wallet) {
                        tonConnectUI.openModal();
                        return;
                    }
                     try {
                        const transaction = {
                             validUntil: Math.floor(Date.now() / 1000) + 60,
                             messages: [{ address: RECIPIENT_WALLET_ADDRESS, amount: (car.cost * 1e9).toString() }],
                         };
                        const resultBoc = await tonConnectUI.sendTransaction(transaction);
                        if (!resultBoc) {
                            throw new Error("Transaction failed: no response from wallet.");
                        }

                         handleUserUpdate(prev => ({
                             ...prev,
                             streetRacingProgress: {
                                 ...prev.streetRacingProgress,
                                 unlockedCars: [...prev.streetRacingProgress.unlockedCars, carIndex],
                                 currentCar: carIndex
                             }
                         }));
                         showNotification(`${car.name} unlocked!`);
                     } catch (e) {
                        showNotification("Transaction failed or rejected.");
                     }
                } else {
                    handleUserUpdate(prev => ({ ...prev, streetRacingProgress: { ...prev.streetRacingProgress, currentCar: carIndex }}));
                }
            };
            
            // Expose methods
            game.current = { startRace, showGarage, closeGarage, watchAdForReward, buyUpgradeWithTon, watchAdForUpgrade, selectCar, carDefs, getCarStats };
            
            // Start game loop
            gameLoop();
            
            // Show menu after a delay
            setTimeout(() => {
                setIsLoading(false);
                setMenuVisible(true);
            }, 1500);
        };
        
        initGame();

        // --- Event Listeners ---
        const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => { // Cleanup
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
            if (gameRendererRef.current) gameRendererRef.current.innerHTML = '';
            game.current = null;
        };
    }, [user]); // Re-init if user object changes drastically (login/logout)
    
     // Effect to update UI-facing state from user object
    useEffect(() => {
        if (user) {
            setUiData(d => ({
                ...d,
                tonBalance: user.ton,
                careerPoints: user.streetRacingProgress.careerPoints,
            }));
            const stats = game.current?.getCarStats(user.streetRacingProgress.currentCar);
            if (stats) {
                setGarageData({
                    selectedCarIndex: user.streetRacingProgress.currentCar,
                    speed: stats.speed,
                    accel: stats.acceleration,
                    handling: stats.handling,
                    nitro: stats.nitro,
                });
            }
        }
    }, [user, isGarageVisible, isMenuVisible]);


    const renderCarCard = (car: any, index: number) => {
        const isUnlocked = user?.streetRacingProgress.unlockedCars.includes(index);
        const isSelected = user?.streetRacingProgress.currentCar === index;
        return (
            <div key={index} 
                 className={`car-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                 onClick={() => game.current.selectCar(index)}>
                <span style={{fontSize: '2rem'}}>{car.emoji}</span>
                <h4 style={{margin: '5px 0'}}>{car.name}</h4>
                {!isUnlocked && <div className="ton-balance" style={{fontSize: '12px'}}>Cost: {car.cost} TON</div>}
            </div>
        );
    };

    return (
        <div className="bg-slate-900 text-white w-full h-full fixed inset-0">
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                /* Removed body overflow rule */
                #gameContainer { position: relative; width: 100%; height: 100%; }
                #gameRenderer { display: block; width: 100%; height: 100%; }
                .racing-ui { position: absolute; top: 20px; left: 20px; background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 15px; border: 2px solid #22c55e; box-shadow: 0 0 30px rgba(34, 197, 94, 0.3); backdrop-filter: blur(10px); z-index: 10; }
                .speed-meter { position: absolute; bottom: 30px; right: 30px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(34, 197, 94, 0.2), rgba(0, 0, 0, 0.8)); border-radius: 50%; border: 3px solid #22c55e; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #22c55e; z-index: 10;}
                .nitro-bar { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 200px; height: 20px; background: rgba(0, 0, 0, 0.8); border-radius: 10px; border: 2px solid #00ffff; overflow: hidden; z-index: 10;}
                .nitro-fill { height: 100%; background: linear-gradient(90deg, #00ffff, #0099ff, #0066ff); border-radius: 8px; transition: width 0.3s; box-shadow: 0 0 15px rgba(0, 255, 255, 0.5); }
                .menu-screen { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #1e293b 0%, #047857 50%, #1e293b 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; z-index: 1000; overflow-y: auto; padding: 20px; }
                .game-title { font-size: 42px; color: #22c55e; margin-bottom: 20px; text-shadow: 0 0 30px rgba(34, 197, 94, 0.8); animation: neonGlow 2s ease-in-out infinite alternate; font-weight: bold; letter-spacing: 2px; }
                @keyframes neonGlow { from { text-shadow: 0 0 20px rgba(34, 197, 94, 0.5); transform: scale(1); } to { text-shadow: 0 0 40px rgba(34, 197, 94, 1), 0 0 60px rgba(52, 211, 153, 0.5); transform: scale(1.02); } }
                .racing-button { background: linear-gradient(45deg, #22c55e, #16a34a); border: none; color: white; padding: 15px 30px; margin: 10px; border-radius: 30px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.3s; box-shadow: 0 5px 20px rgba(34, 197, 94, 0.4); text-transform: uppercase; letter-spacing: 1px; }
                .racing-button:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.6); background: linear-gradient(45deg, #16a34a, #22c55e); }
                .ad-button { background: linear-gradient(45deg, #10b981, #059669); animation: pulse 2s infinite; }
                .ton-button { background: linear-gradient(45deg, #3b82f6, #2563eb); font-size: 14px; }
                @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4); } 50% { transform: scale(1.05); box-shadow: 0 8px 30px rgba(16, 185, 129, 0.6); } 100% { transform: scale(1); box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4); } }
                .garage-panel { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.98); padding: 30px; border-radius: 20px; border: 3px solid #22c55e; text-align: center; box-shadow: 0 0 50px rgba(34, 197, 94, 0.5); max-height: 85vh; overflow-y: auto; min-width: 600px; z-index: 1001;}
                .car-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-item { background: rgba(34, 197, 94, 0.1); padding: 15px; border-radius: 10px; border: 1px solid #22c55e; }
                .stat-bar { width: 100%; height: 8px; background: rgba(255, 255, 255, 0.2); border-radius: 4px; overflow: hidden; margin: 10px 0; }
                .stat-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 4px; transition: width 0.5s; }
                .car-selection { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
                .car-card { background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 15px; border: 2px solid transparent; cursor: pointer; transition: all 0.3s; position: relative; }
                .car-card:hover, .car-card.selected { border-color: #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); transform: translateY(-5px); }
                .car-card.locked { opacity: 0.5; cursor: not-allowed; }
                .balance-display { font-size: 18px; margin: 15px 0; color: #94a3b8; }
                .ton-balance { color: #60a5fa; font-weight: bold; }
                .notification { position: fixed; top: 80px; right: 20px; background: rgba(15, 23, 42, 0.9); color: #22c55e; padding: 15px 25px; border-radius: 10px; border: 2px solid #22c55e; z-index: 10000; animation: slideIn 0.5s ease-out; max-width: 300px; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .controls-info { position: absolute; bottom: 20px; left: 20px; background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; border: 2px solid #22c55e; font-size: 12px; z-index: 10;}
                .loading-screen { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 5000; }
                .loading-spinner { width: 60px; height: 60px; border: 4px solid rgba(34, 197, 94, 0.3); border-top: 4px solid #22c55e; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .race-progress { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 300px; height: 15px; background: rgba(0, 0, 0, 0.8); border-radius: 8px; border: 2px solid #22c55e; overflow: hidden; z-index: 10;}
                .progress-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 6px; transition: width 0.3s; }
                h2, h3, h4 { color: white; }
                h3 { color: #22c55e; margin: 20px 0; }
                p { color: #cbd5e1; }
                @media (max-width: 768px) { .garage-panel { min-width: 90vw; padding: 20px; max-height: 80vh; } .car-stats, .car-selection { grid-template-columns: 1fr; } .game-title { font-size: 28px; } }
            `}</style>
             <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm z-40 p-4 border-b border-slate-700/50 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center font-semibold text-white w-24">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Back
                </button>
                 <div className="text-center font-bold text-lg text-white">
                    Street Racing
                 </div>
                 <div className="w-24 text-right flex items-center justify-end space-x-2 bg-slate-800 px-2 py-1 rounded-lg">
                    {ICONS.ton}
                    <span className="font-bold text-blue-400">{uiData.tonBalance.toFixed(4)}</span>
                </div>
            </header>

            <main className="pt-16 h-full">
                <div id="gameContainer">
                    {isLoading && <div id="loadingScreen" className="loading-screen">
                        <div className="loading-spinner"></div>
                        <h2 style={{color: '#22c55e'}}>Loading Street Racing Empire...</h2>
                    </div>}

                    {isMenuVisible && <div id="menuScreen" className="menu-screen">
                        <h1 className="game-title">STREET RACING EMPIRE</h1>
                        <div className="balance-display">🏆 Career Points: <span className="text-white">{uiData.careerPoints}</span></div>
                        <button className="racing-button" onClick={() => game.current.showGarage()}>🔧 Garage</button>
                        <button className="racing-button" onClick={() => game.current.startRace()}>🏁 Quick Race</button>
                        <button className="ad-button racing-button" onClick={() => game.current.watchAdForReward()}>📺 Watch Ad & Earn!</button>
                    </div>}

                    <div id="gameRenderer" ref={gameRendererRef} style={{ display: isRacingUI || isMenuVisible || isLoading ? 'block' : 'none' }}></div>

                    {isRacingUI && <div id="racingUI">
                        <div className="race-progress">
                            <div id="raceProgressFill" className="progress-fill" style={{width: `${uiData.progress}%`}}></div>
                        </div>
                        <div className="racing-ui">
                            <div><span className="text-green-400">Position:</span> {uiData.position}</div>
                            <div><span className="text-green-400">Time:</span> {uiData.time}</div>
                        </div>
                        <div className="speed-meter">
                            <span id="speedometer">{uiData.speed}</span>
                            <div style={{fontSize: '12px', marginTop: '5px'}}>MPH</div>
                        </div>
                        <div className="nitro-bar">
                            <div id="nitroFill" className="nitro-fill" style={{width: `${uiData.nitro}%`}}></div>
                        </div>
                        <div className="controls-info">
                            <strong>Controls:</strong> A/D or ◀/▶ to Steer, Space for Nitro
                        </div>
                    </div>}

                    {isGarageVisible && <div id="garagePanel" className="garage-panel">
                        <h2>🔧 Your Garage</h2>
                        <div className="balance-display">💰 App TON Balance: <span className="ton-balance">{uiData.tonBalance.toFixed(4)}</span></div>
                        <h3>🚗 Select Your Car</h3>
                        <div className="car-selection">{game.current?.carDefs.map(renderCarCard)}</div>

                        <h3>📊 Car Statistics</h3>
                        <div className="car-stats">
                            <div className="stat-item"><h4>🏎️ Speed</h4><div className="stat-bar"><div className="stat-fill" style={{width: `${garageData.speed}%`}}></div></div><span>{garageData.speed}/100</span></div>
                            <div className="stat-item"><h4>🔧 Accel</h4><div className="stat-bar"><div className="stat-fill" style={{width: `${garageData.accel}%`}}></div></div><span>{garageData.accel}/100</span></div>
                            <div className="stat-item"><h4>🛞 Handling</h4><div className="stat-bar"><div className="stat-fill" style={{width: `${garageData.handling}%`}}></div></div><span>{garageData.handling}/100</span></div>
                            <div className="stat-item"><h4>🚀 Nitro</h4><div className="stat-bar"><div className="stat-fill" style={{width: `${garageData.nitro}%`}}></div></div><span>{garageData.nitro}/100</span></div>
                        </div>

                        <h3>⚡ Upgrades (Pay with Wallet)</h3>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                            <div className="stat-item"><h4>Engine</h4><p>+10 Spd/Acc</p><button className="ad-button racing-button" onClick={() => game.current.watchAdForUpgrade('engine')}>📺 15 Ads</button><button className="ton-button racing-button" onClick={() => game.current.buyUpgradeWithTon('engine')}>💰 0.08 TON</button></div>
                            <div className="stat-item"><h4>Tires</h4><p>+15 Handling</p><button className="ad-button racing-button" onClick={() => game.current.watchAdForUpgrade('tires')}>📺 10 Ads</button><button className="ton-button racing-button" onClick={() => game.current.buyUpgradeWithTon('tires')}>💰 0.05 TON</button></div>
                            <div className="stat-item"><h4>Nitro</h4><p>+20 Nitro</p><button className="ad-button racing-button" onClick={() => game.current.watchAdForUpgrade('nitro')}>📺 20 Ads</button><button className="ton-button racing-button" onClick={() => game.current.buyUpgradeWithTon('nitro')}>💰 0.12 TON</button></div>
                        </div>
                        <button className="racing-button" onClick={() => game.current.closeGarage()} style={{marginTop: '20px'}}>✔ Done</button>
                    </div>}

                    {notification && <div className="notification">{notification}</div>}
                </div>
            </main>
        </div>
    );
};

export default StreetRacingPage;