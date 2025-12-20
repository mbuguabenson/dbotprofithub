import { useState, useEffect } from 'react';
import { DerivLogo } from '@deriv-com/ui';
import { motion, AnimatePresence } from 'framer-motion';
import './initial-loader.scss';

const STEPS = [
    { id: 1, text: 'Connecting to Deriv API' },
    { id: 2, text: 'Initializing market data' },
    { id: 3, text: 'Setting up data from servers' },
    { id: 4, text: 'Connecting accounts' },
    { id: 5, text: 'Finalizing setup' },
];

export default function InitialLoader() {
    const [progress, setProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        // Mock progress simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Varying speed for realism
                const increment = Math.random() * 5 + 0.5;
                return Math.min(prev + increment, 100);
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Sync active step with progress
        const stepIndex = Math.min(Math.floor(progress / 20), STEPS.length - 1);
        setActiveStep(stepIndex);
    }, [progress]);

    return (
        <div className='initial-loader-container'>
            <motion.div 
                className='prominent-logo-container'
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <DerivLogo variant='wallets' className="prominent-logo" />
            </motion.div>

            <motion.div 
                className='loader-header'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <h1>Profit Hub</h1>
                <p>Smart Analysis • High Accuracy • Advanced Automation</p>
                <motion.span 
                    className='status-text'
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    System Initialization In Progress
                </motion.span>
            </motion.div>

            <motion.div 
                className='progress-wrapper'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                <div className='progress-bar-bg'>
                    <div className='progress-bar-fill' style={{ width: `${progress}%` }} />
                </div>
                <div className='percentage'>{Math.round(progress)}%</div>
            </motion.div>

            <motion.div 
                className='initialization-card'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
            >
                <h3>System Logs</h3>
                <div className='step-list'>
                    {STEPS.map((step, index) => {
                        const isActive = index === activeStep && progress < 100;
                        const isCompleted = index < activeStep || progress >= 100;

                        return (
                            <div
                                key={step.id}
                                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                <div className='left-content'>
                                    <div className='step-icon'>
                                        {isActive && <div className='spinner' />}
                                        <AnimatePresence mode='wait'>
                                            {isCompleted ? (
                                                <motion.svg 
                                                    key='check'
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="3" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </motion.svg>
                                            ) : (
                                                !isActive && <div className="dot" key='dot' />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <span className='step-text'>{step.text}</span>
                                </div>
                                <div className='step-status'>
                                    {isActive ? 'Pending' : isCompleted ? 'Success' : 'Ready'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <motion.div 
                className='footer-branding'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
            >
                <span>Certified Trading Platform</span>
                <DerivLogo variant='wallets' className="deriv-logo" />
            </motion.div>
        </div>
    );
}

