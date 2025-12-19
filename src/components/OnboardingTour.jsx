import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import { ArrowRight, Check } from 'lucide-react';

const OnboardingTour = ({ steps, onComplete, isOpen }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const updateRect = () => {
            const step = steps[currentStepIndex];
            const element = document.getElementById(step.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
                // Smooth scroll to element
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [currentStepIndex, isOpen, steps]);

    if (!isOpen) return null;

    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] overflow-hidden">
                {/* Backdrop with SVG Mask for the "Hole" effect */}
                {/* Fallback backdrop if no target is focused (darken screen) */}
                {!targetRect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />
                )}

                {targetRect && (
                    <motion.div
                        className="absolute rounded-xl border-2 border-neon-green shadow-[0_0_0_9999px_rgba(15,23,42,0.85),0_0_15px_rgba(34,197,94,0.5)] pointer-events-none"
                        initial={false}
                        animate={{
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}

                {/* Tooltip Card */}
                <motion.div
                    className={targetRect ? "absolute w-full max-w-xs p-4" : "fixed inset-0 flex items-center justify-center p-4 pointer-events-none"}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={targetRect ? {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        top: targetRect.top > window.innerHeight / 2 ? 'auto' : targetRect.top + targetRect.height + 24,
                        bottom: targetRect.top > window.innerHeight / 2 ? window.innerHeight - targetRect.top + 24 : 'auto',
                        left: Math.max(16, Math.min(window.innerWidth - 320 - 16, targetRect.left + (targetRect.width / 2) - 160))
                    } : {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        top: 'auto',
                        bottom: 'auto',
                        left: 'auto'
                    }}
                    transition={{ duration: 0.4, type: "spring" }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-neon-green/30 p-6 rounded-2xl shadow-2xl relative pointer-events-auto max-w-xs w-full overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-neon-green/20 rounded-full blur-xl animate-pulse"></div>

                        {/* Progress Dots */}
                        <div className="flex space-x-1.5 mb-4 justify-center">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-6 bg-neon-green' : 'w-1 bg-slate-700'}`}
                                />
                            ))}
                        </div>

                        <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tight relative z-10">
                            {currentStep.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed relative z-10 font-medium">
                            {currentStep.content}
                        </p>

                        <div className="flex justify-between items-center relative z-10">
                            <button
                                onClick={onComplete}
                                className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider px-2 py-1"
                            >
                                Saltar Intro
                            </button>
                            <Button
                                onClick={handleNext}
                                variant="primary"
                                className="px-5 py-2.5 text-xs shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                            >
                                {isLastStep ? '¡Vamos!' : 'Siguiente'}
                                {isLastStep ? <Check size={16} className="ml-2" /> : <ArrowRight size={16} className="ml-2" />}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingTour;
