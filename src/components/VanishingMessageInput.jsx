import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Mic, Send } from "lucide-react";
import { cn } from "../lib/utils";

const VanishingMessageInput = ({
    message,
    setMessage,
    handleSend,
    placeholder = "Send a message...",
    priorityPlaceholder = "",
    onMicClick,
    showWorkflow = false,
    handleQueryUpdate,
    isDisabled = false,
    onFocus,
    onBlur,
}) => {
    const inputRef = useRef(null);
    const canvasRef = useRef(null);
    const newDataRef = useRef([]);
    const [isFocused, setIsFocused] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const [currentCursorPosition, setCurrentCursorPosition] = useState(0);
    const [transcript, setTranscript] = useState('');
    const lastProcessedIndex = useRef(0);

    // Auto-resize textarea based on content
    const autoResizeMessageInput = (element) => {
        if (!element) return;
        element.style.height = "0";
        const newHeight = Math.min(element.scrollHeight, 200); // Max height of 200px
        element.style.height = `${newHeight}px`;
    };

    // Canvas drawing for vanishing effect
    const draw = useCallback(() => {
        if (!inputRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 800;
        canvas.height = 200;
        ctx.clearRect(0, 0, 800, 200);
        const computedStyles = getComputedStyle(inputRef.current);

        const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
        ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
        ctx.fillStyle = "#FFF";
        ctx.fillText(message, 16, 40);

        const imageData = ctx.getImageData(0, 0, 800, 200);
        const pixelData = imageData.data;
        const newData = [];

        for (let t = 0; t < 200; t++) {
            let i = 4 * t * 800;
            for (let n = 0; n < 800; n++) {
                let e = i + 4 * n;
                if (
                    pixelData[e] !== 0 &&
                    pixelData[e + 1] !== 0 &&
                    pixelData[e + 2] !== 0
                ) {
                    newData.push({
                        x: n,
                        y: t,
                        color: [
                            pixelData[e],
                            pixelData[e + 1],
                            pixelData[e + 2],
                            pixelData[e + 3],
                        ],
                    });
                }
            }
        }

        newDataRef.current = newData.map(({ x, y, color }) => ({
            x,
            y,
            r: 1,
            color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
        }));
    }, [message]);

    useEffect(() => {
        if (message) {
            draw();
        }
    }, [message, draw]);

    // Log when priority placeholder changes
    useEffect(() => {
        if (priorityPlaceholder) {
            console.log("Priority placeholder set to:", priorityPlaceholder);
        }
    }, [priorityPlaceholder]);

    // Animation for text vanishing effect
    const animate = (start) => {
        const animateFrame = (pos = 0) => {
            requestAnimationFrame(() => {
                const newArr = [];
                for (let i = 0; i < newDataRef.current.length; i++) {
                    const current = newDataRef.current[i];
                    if (current.x < pos) {
                        newArr.push(current);
                    } else {
                        if (current.r <= 0) {
                            current.r = 0;
                            continue;
                        }
                        current.x += Math.random() > 0.5 ? 1 : -1;
                        current.y += Math.random() > 0.5 ? 1 : -1;
                        current.r -= 0.05 * Math.random();
                        newArr.push(current);
                    }
                }
                newDataRef.current = newArr;
                const ctx = canvasRef.current?.getContext("2d");
                if (ctx) {
                    ctx.clearRect(pos, 0, 800, 200);
                    newDataRef.current.forEach((t) => {
                        const { x: n, y: i, r: s, color: color } = t;
                        if (n > pos) {
                            ctx.beginPath();
                            ctx.rect(n, i, s, s);
                            ctx.fillStyle = color;
                            ctx.strokeStyle = color;
                            ctx.stroke();
                        }
                    });
                }
                if (newDataRef.current.length > 0) {
                    animateFrame(pos - 8);
                } else {
                    setMessage("");
                    setAnimating(false);
                }
            });
        };
        animateFrame(start);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (isDisabled || !message.trim() || animating) return;

            vanishAndSubmit();
        }
        // No preventDefault when Shift+Enter is pressed, allowing new line
    };

    const vanishAndSubmit = () => {
        if (!message.trim() || isDisabled || animating) return;

        setAnimating(true);
        draw();

        // Get the max X position for animation
        const maxX = newDataRef.current.reduce(
            (prev, current) => (current.x > prev ? current.x : prev),
            0
        );

        animate(maxX);

        // Trigger the appropriate action
        setTimeout(() => {
            if (showWorkflow && handleQueryUpdate) {
                handleQueryUpdate(message);
            } else {
                handleSend();
            }
        }, 500); // Wait a bit for animation to start
    };

    useEffect(() => {
        // Store references to cursor position when input field changes
        if (inputRef.current) {
            const handleSelect = () => {
                setCurrentCursorPosition(inputRef.current.selectionEnd || message.length);
            };

            inputRef.current.addEventListener('click', handleSelect);
            inputRef.current.addEventListener('keyup', handleSelect);

            // Initialize to end of message
            setCurrentCursorPosition(message.length);

            return () => {
                if (inputRef.current) {
                    inputRef.current.removeEventListener('click', handleSelect);
                    inputRef.current.removeEventListener('keyup', handleSelect);
                }
            };
        }
    }, [message]);

    useEffect(() => {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setCurrentCursorPosition(message.length);
                setTranscript('');
                lastProcessedIndex.current = 0;
            };

            recognition.onresult = (event) => {
                let newTranscript = '';

                for (let i = lastProcessedIndex.current; i < event.results.length; i++) {
                    const result = event.results[i];

                    if (result.isFinal) {
                        newTranscript += result[0].transcript;
                        lastProcessedIndex.current = i + 1;
                    }
                }

                if (newTranscript) {
                    setTranscript((prev) => prev + newTranscript);

                    setMessage((currentMessage) => {
                        const needsSpace =
                            currentMessage.length > 0 &&
                            !currentMessage.endsWith(' ') &&
                            !newTranscript.startsWith(' ');

                        const spacer = needsSpace ? ' ' : '';
                        const updatedMessage = currentMessage + spacer + newTranscript;

                        setCurrentCursorPosition(updatedMessage.length);

                        // Decrease the delay to make voice input more responsive
                        if (inputRef.current) {
                            autoResizeMessageInput(inputRef.current);
                        }

                        return updatedMessage;
                    });
                }

                let interimTranscript = '';
                for (let i = lastProcessedIndex.current; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (!result.isFinal) {
                        interimTranscript += result[0].transcript;
                    }
                }

                if (interimTranscript) {
                    setTranscript((prev) => prev + interimTranscript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                lastProcessedIndex.current = 0;
            };

            recognition.onend = () => {
                setIsListening(false);
                setTranscript('');
                lastProcessedIndex.current = 0;
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [setMessage]);

    const handleMicClick = () => {
        if (onMicClick) {
            onMicClick();
            return;
        }

        if (recognitionRef.current) {
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                // Don't add placeholder text when clicking mic
                // Just focus the input and start recognition immediately
                if (inputRef.current) {
                    inputRef.current.focus();

                    // Set cursor position to end of any existing text
                    const len = message.length;
                    inputRef.current.selectionStart = len;
                    inputRef.current.selectionEnd = len;
                    setCurrentCursorPosition(len);
                }

                recognitionRef.current.start();
            }
        } else {
            alert("Speech recognition is not supported in this browser");
        }
    };

    const handleFocusChange = (focused) => {
        setIsFocused(focused);
        
        // Call the passed focus/blur handlers if provided
        if (focused && onFocus) {
            onFocus();
        } else if (!focused && onBlur) {
            onBlur();
        }
    };

    return (
        <div className="relative flex-1">
            <div
                className={`flex items-center p-2 rounded-lg transition-all duration-300 ${
                    isFocused
                        ? "bg-gray-700 shadow-lg border border-gray-600"
                        : "bg-gray-800 border border-gray-700"
                }`}
            >
                <canvas
                    className={cn(
                        "absolute pointer-events-none text-base transform scale-50 top-[20%] left-2 sm:left-8 origin-top-left filter invert dark:invert-0",
                        !animating ? "opacity-0" : "opacity-100"
                    )}
                    ref={canvasRef}
                />

                <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => {
                        if (!animating) {
                            setMessage(e.target.value);
                            autoResizeMessageInput(e.target);
                        }
                    }}
                    onKeyDown={handleKeyPress}
                    onClick={(e) => {
                        const target = e.target;
                        if (target instanceof HTMLTextAreaElement) {
                            setCurrentCursorPosition(target.selectionEnd || target.value.length);
                        }
                    }}
                    onSelect={(e) => {
                        const target = e.target;
                        if (target instanceof HTMLTextAreaElement) {
                            setCurrentCursorPosition(target.selectionEnd || target.value.length);
                        }
                    }}
                    onFocus={() => handleFocusChange(true)}
                    onBlur={() => handleFocusChange(false)}
                    placeholder=""
                    disabled={isDisabled || animating}
                    className="flex-grow bg-transparent outline-none resize-none min-h-[40px] max-h-[200px] px-2 py-1 text-[var(--color-text)]"
                    style={{ minHeight: "40px", maxHeight: "200px" }}
                    rows={1}
                />

                {/* Mic button */}
                <button
                    onClick={handleMicClick}
                    className={cn(
                        "p-2 rounded-full mr-1 transition-colors",
                        isListening
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                    )}
                    aria-label={isListening ? "Stop listening" : "Voice input"}
                    disabled={animating}
                >
                    <Mic size={18} />
                    {isListening && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </button>

                {/* Send button */}
                <button
                    onClick={vanishAndSubmit}
                    disabled={isDisabled || !message.trim() || animating}
                    className={`p-2 rounded-full transition-all ${
                        !message.trim() || isDisabled || animating
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-[var(--color-primary)] text-black hover:shadow-md active:scale-95"
                    }`}
                >
                    <Send size={20} />
                </button>
            </div>

            {/* Ensure placeholder is shown whenever message is empty */}
            {(message === "" || message.trim().length === 0) && !isListening && (
                <div className="absolute inset-0 flex items-center pointer-events-none pl-2 pr-64 align-left">
                    <div className="text-gray-300 truncate transition-all duration-300 w-full">
                        {priorityPlaceholder || placeholder}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VanishingMessageInput;
