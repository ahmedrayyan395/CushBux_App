import React, { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ICONS } from '../constants';

// Make the ad SDK function available
declare const show_9692552: (type?: 'pop') => Promise<void>;

// --- HELPER COMPONENTS ---

const GameButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string, disabled?: boolean }> = ({ onClick, children, className = '', disabled=false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const UpgradeButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string, disabled?: boolean }> = ({ onClick, children, className = '', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full bg-slate-700 text-white font-semibold py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);


// --- MAIN GAME COMPONENT ---

const SpaceDefenderPage: React.FC<{ user: User | null; setUser: Dispatch<SetStateAction<User | null>> }> = ({ user, setUser }) => {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gameLoopId = useRef<number | null>(null);
    const keys = useRef<{ [key: string]: boolean }>({});
    const lastShootTime = useRef(0);

    // Game state that does not trigger re-renders
    const gameState = useRef({
        isPlaying: false,
        level: 1,
        score: 0,
        health: 100,
        maxHealth: 100,
        coins: user?.coins ?? 0,
        upgrades: user?.spaceDefenderProgress ?? { weaponLevel: 1, shieldLevel: 1, speedLevel: 1 },
    });

    // UI state that triggers re-renders
    const [isMenuVisible, setIsMenuVisible] = useState(true);
    const [isUpgradePanelVisible, setIsUpgradePanelVisible] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    const UPGRADE_COSTS = {
        weapon: 200000,
        shield: 300000,
        speed: 100000,
    };

    // Sync state with user prop
    useEffect(() => {
        if (user) {
            gameState.current.coins = user.coins;
            gameState.current.upgrades = user.spaceDefenderProgress;
        }
    }, [user]);
    
    // Show notifications and clear them
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message: string) => {
        setNotification(message);
    };

    // --- Core Game Logic (adapted for React) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let bullets: any[] = [];
        let enemies: any[] = [];
        let particles: any[] = [];
        const player = { x: canvas.width / 2 - 25, y: canvas.height - 80, width: 50, height: 50, speed: 5 };

        const updatePlayerSpeed = () => {
            player.speed = 5 + (gameState.current.upgrades.speedLevel - 1) * 2;
        };
        updatePlayerSpeed();

        const persistGameState = () => {
             setUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    coins: gameState.current.coins,
                    spaceDefenderProgress: gameState.current.upgrades,
                };
            });
        };

        const checkCollision = (obj1: any, obj2: any) => (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );

        const createExplosion = (x: number, y: number) => {
            for (let i = 0; i < 15; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 30,
                    color: ['#ffcc00', '#ff6600', '#ff0000'][Math.floor(Math.random() * 3)]
                });
            }
        };

        const shoot = () => {
            const now = Date.now();
            const fireRate = 250 - (gameState.current.upgrades.weaponLevel * 20);
            if (now - lastShootTime.current < fireRate) return;
            lastShootTime.current = now;

            const bulletCount = Math.min(gameState.current.upgrades.weaponLevel, 5);
            for (let i = 0; i < bulletCount; i++) {
                bullets.push({
                    x: player.x + player.width / 2 - 2 + (i - Math.floor(bulletCount/2)) * 10,
                    y: player.y, width: 5, height: 15, speed: 10,
                });
            }
        };

        const spawnEnemy = () => {
            if (Math.random() < 0.02 + gameState.current.level * 0.005) {
                enemies.push({
                    x: Math.random() * (canvas.width - 40), y: -40,
                    width: 40, height: 40,
                    speed: 1.5 + gameState.current.level * 0.2
                });
            }
        };
        
        const endGame = async () => {
            gameState.current.isPlaying = false;
            showNotification(`Game Over! Final Score: ${gameState.current.score.toLocaleString()}`);
            setIsMenuVisible(true);
            
            // Monetization: Show an ad automatically on game over.
            try {
                await show_9692552();
            } catch (e) {
                console.error("Ad failed to show on game over:", e);
            }
        };

        const update = () => {
            if (!gameState.current.isPlaying) return;

            // Player movement
            if (keys.current['ArrowLeft'] || keys.current['KeyA']) player.x = Math.max(0, player.x - player.speed);
            if (keys.current['ArrowRight'] || keys.current['KeyD']) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
            if (keys.current['Space']) shoot();
            
            spawnEnemy();

            // Update bullets
            bullets = bullets.filter(b => b.y > -20);
            bullets.forEach(b => b.y -= b.speed);

            // Update enemies & collisions
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                enemy.y += enemy.speed;

                if (enemy.y > canvas.height) {
                    enemies.splice(i, 1);
                    continue;
                }

                if (checkCollision(player, enemy)) {
                    const damage = Math.max(5, 20 - (gameState.current.upgrades.shieldLevel - 1) * 3);
                    gameState.current.health -= damage;
                    enemies.splice(i, 1);
                    createExplosion(enemy.x, enemy.y);
                    if (gameState.current.health <= 0) {
                        endGame();
                        return;
                    }
                    continue;
                }

                for (let j = bullets.length - 1; j >= 0; j--) {
                    if (checkCollision(bullets[j], enemy)) {
                        gameState.current.score += 10 * gameState.current.level;
                        bullets.splice(j, 1);
                        enemies.splice(i, 1);
                        createExplosion(enemy.x, enemy.y);
                        if (gameState.current.score > gameState.current.level * 1000) {
                            gameState.current.level++;
                            showNotification(`Level Up! Reached Level ${gameState.current.level}`);
                        }
                        break;
                    }
                }
            }

            // Update particles
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
        };
        
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw player
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            if (gameState.current.upgrades.shieldLevel > 1) {
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 2 + gameState.current.upgrades.shieldLevel;
                ctx.strokeRect(player.x - ctx.lineWidth/2, player.y - ctx.lineWidth/2, player.width + ctx.lineWidth, player.height + ctx.lineWidth);
            }
            
            // Draw bullets
            ctx.fillStyle = gameState.current.upgrades.weaponLevel > 3 ? '#f0f' : '#ff0';
            bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

            // Draw enemies
            ctx.fillStyle = '#ff4444';
            enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
            
            // Draw particles
            particles.forEach(p => {
                ctx.globalAlpha = p.life / 30.0;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 3, 3);
            });
            ctx.globalAlpha = 1.0;
        };

        const gameLoop = () => {
            if (gameState.current.isPlaying) {
                update();
                render();
            }
            gameLoopId.current = requestAnimationFrame(gameLoop);
        };
        
        const startGame = () => {
            gameState.current.isPlaying = true;
            gameState.current.level = 1;
            gameState.current.score = 0;
            gameState.current.maxHealth = 100 + (gameState.current.upgrades.shieldLevel - 1) * 25;
            gameState.current.health = gameState.current.maxHealth;
            bullets = []; enemies = []; particles = [];
            player.x = canvas.width / 2 - player.width / 2;
            updatePlayerSpeed();
            setIsMenuVisible(false);
        };

        // --- Event Listeners Setup ---
        const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Touch controls
        let touchStartX = 0;
        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
        };
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (!gameState.current.isPlaying) return;
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - touchStartX;
            player.x += deltaX;
            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            touchStartX = touchX;
        };
        const handleTouchEnd = (e: TouchEvent) => { e.preventDefault(); if(gameState.current.isPlaying) shoot(); };

        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);
        
        // Auto-shoot interval
        const autoShootInterval = setInterval(() => { if (gameState.current.isPlaying) shoot(); }, 200);

        gameLoopId.current = requestAnimationFrame(gameLoop);
        
        // Expose functions to component scope
        (window as any)._spaceDefender = { startGame, persistGameState };

        return () => { // Cleanup function
            if (gameLoopId.current) {
                cancelAnimationFrame(gameLoopId.current);
            }
            clearInterval(autoShootInterval);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (canvas) {
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchmove', handleTouchMove);
                canvas.removeEventListener('touchend', handleTouchEnd);
            }
            (window as any)._spaceDefender?.persistGameState();
            delete (window as any)._spaceDefender;
        };

    }, []); // Run only once on mount

    const handleStartGame = () => (window as any)._spaceDefender?.startGame();
    
    const handleBuyUpgradeWithCoins = (type: 'weapon' | 'shield' | 'speed') => {
        const cost = UPGRADE_COSTS[type] * gameState.current.upgrades[`${type}Level`];
        if (gameState.current.coins >= cost) {
            gameState.current.coins -= cost;
            gameState.current.upgrades[`${type}Level`] += 1;
            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} upgraded!`);
            (window as any)._spaceDefender.persistGameState();
        } else {
            showNotification("Not enough coins!");
        }
    };

    if (!user) return <div className="text-center p-8">Loading user data...</div>;

    const gs = gameState.current;
    
    const renderUpgradeItem = (type: 'weapon' | 'shield' | 'speed', icon: React.ReactNode, title: string) => {
        const level = gs.upgrades[`${type}Level`];
        const coinCost = UPGRADE_COSTS[type] * level;
        return (
            <div className="bg-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-3">
                    <div className="text-xl text-green-400">{icon}</div>
                    <h3 className="font-semibold text-white">{title} <span className="text-slate-400">(Level {level})</span></h3>
                </div>
                <div className="flex space-x-2">
                    <UpgradeButton onClick={() => handleBuyUpgradeWithCoins(type)} disabled={gs.coins < coinCost}>
                        {coinCost.toLocaleString()} Coins
                    </UpgradeButton>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-900 text-white w-full h-full fixed inset-0 overflow-hidden">
             <style>{`
                canvas {
                    background: linear-gradient(180deg, #01041a 0%, #031842 100%);
                    display: block;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
            
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm z-40 p-4 border-b border-slate-700/50 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center font-semibold text-white w-24">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Back
                </button>
                 <div className="text-center font-bold text-lg">
                    {isMenuVisible ? "Space Defender" : `Score: ${gs.score.toLocaleString()}`}
                 </div>
                 <div className="w-24 text-right flex items-center justify-end space-x-2 bg-slate-800 px-2 py-1 rounded-lg">
                    {ICONS.coin}
                    <span className="font-bold">{Math.floor(gs.coins).toLocaleString()}</span>
                </div>
            </header>

            {/* Game Canvas */}
            <main className="pt-16 h-full">
                <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight - 64}></canvas>
            </main>
            
             {/* Menu Screen */}
            {isMenuVisible && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20 space-y-6">
                    <h1 className="text-5xl font-bold text-green-400" style={{ textShadow: '0 0 15px rgba(52, 211, 153, 0.5)' }}>SPACE DEFENDER</h1>
                    <p className="text-slate-300">Your mission: Defend the galaxy from alien invaders!</p>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <GameButton onClick={handleStartGame}>{gs.score > 0 ? 'Play Again' : 'Start Game'}</GameButton>
                        <GameButton onClick={() => setIsUpgradePanelVisible(true)} className="bg-blue-500 hover:bg-blue-600">Upgrades</GameButton>
                    </div>
                     <p className="text-slate-400 text-sm">Last Score: {gs.score.toLocaleString()}</p>
                </div>
            )}
            
            {/* Upgrade Panel */}
            {isUpgradePanelVisible && (
                 <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-4" onClick={() => setIsUpgradePanelVisible(false)}>
                    <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-md shadow-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Ship Upgrades</h2>
                            <button onClick={() => setIsUpgradePanelVisible(false)} className="text-slate-400 text-3xl hover:text-white">&times;</button>
                        </div>
                        <p className="text-center text-slate-300">Use your coins earned from tasks to enhance your ship.</p>
                        
                        {renderUpgradeItem('weapon', ICONS.zap, 'Weapon System')}
                        {renderUpgradeItem('shield', <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, 'Shield System')}
                        {renderUpgradeItem('speed', <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>, 'Maneuverability')}
                    </div>
                 </div>
            )}
            
            {/* In-Game UI */}
            {!isMenuVisible && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-800/50 backdrop-blur-sm p-2 rounded-lg z-10 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <span className="font-bold text-red-500">HP:</span>
                        <div className="w-32 bg-slate-700 rounded-full h-4 border border-slate-600">
                             <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.max(0, (gs.health / gs.maxHealth) * 100)}%` }}></div>
                        </div>
                    </div>
                    <div className="font-bold text-lg text-green-400">LVL: {gs.level}</div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                 <div className="fixed top-20 right-4 bg-slate-800 text-green-400 p-4 rounded-lg border-2 border-green-500 shadow-lg z-50 animate-pulse">
                    {notification}
                </div>
            )}
        </div>
    );
};

export default SpaceDefenderPage;