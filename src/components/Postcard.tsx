import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/lib/sendMessage";

const Postcard = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const cardRef = useRef(null);
  const [cardHeight, setCardHeight] = useState("auto");

  useEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight + "px");
    }
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setStamped(true);

    try {
      await sendMessage({ name, email, message });
      setTimeout(() => setSent(true), 600);
    } catch (err) {
      console.error(err);
      alert("Oops! Could not send the postcard.");
      setStamped(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setStamped(false);
    setName("");
    setMessage("");
    setEmail("");
  };

  return (
    <div className="w-full">
      <p className="editorial-label mb-4">Send a Hello</p>

      {/* Outer frame */}
      <motion.div
        animate={stamped ? { rotate: [0, -1, 1, 0], scale: [1, 0.98, 1] } : {}}
        transition={{ duration: 0.5 }}
        style={{
          border: "1px solid hsl(var(--border))",
          padding: "4px",
          boxShadow: "4px 4px 0 hsl(var(--border))",
          backgroundColor: "hsl(var(--card))",
          borderRadius: "2px",
          width: "100%",
        }}
      >
        {/* Inner frame */}
        <div
          ref={cardRef}
          style={{
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
            padding: "20px 20px 22px 20px",
            borderRadius: "1px",
            minHeight: cardHeight, // FIX the card shape for consistency 
            transition: "min-height 0.2s",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "hsl(var(--muted-foreground))",
                fontFamily: "inherit",
              }}
            >
              Post Card
            </span>

            {/* Stamp */}
            <motion.div
              animate={stamped ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 1] } : {}}
              transition={{ duration: 0.4 }}
              style={{
                width: "44px",
                height: "52px",
                border: "1px solid hsl(var(--border))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: stamped ? "hsl(var(--plum))" : "transparent",
                transition: "background 0.3s",
                boxShadow: "0 0 0 3px hsl(var(--card)), 0 0 0 4px hsl(var(--border))",
                flexShrink: 0,
                position: "relative",
              }}
            >
              {/* Keep original envelope SVG always */}
              <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="24"
                  height="20"
                  rx="1"
                  stroke="hsl(var(--background))"
                  strokeWidth="1"
                />
                <path d="M1 5 L13 13 L25 5" stroke="hsl(var(--background))" strokeWidth="1" />
              </svg>

              {/* Optional stamped overlay */}
              {stamped && (
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    borderRadius: "2px",
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Horizontal rule */}
          <div style={{ height: "1px", backgroundColor: "hsl(var(--border))", marginBottom: "18px" }} />

          {/* Message / Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {!sent ? (
              <>
                {/* Message textarea */}
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${i * 28 + 26}px`,
                        height: "1px",
                        backgroundColor: "hsl(var(--border))",
                        opacity: 0.5,
                        pointerEvents: "none",
                      }}
                    />
                  ))}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hey, how's it going...?"
                    rows={4}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      lineHeight: "28px",
                      color: "hsl(var(--foreground))",
                      caretColor: "hsl(var(--sage))",
                    }}
                  />
                </div>

                {/* From + Email with Send */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {/* Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "hsl(var(--muted-foreground))",
                        whiteSpace: "nowrap",
                      }}
                    >
                      From:
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name..."
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "13px",
                        color: "hsl(var(--foreground))",
                        caretColor: "hsl(var(--sage))",
                      }}
                    />
                  </div>

                  {/* Email + Send */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "hsl(var(--muted-foreground))",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Email:
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email...(optional)"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "13px",
                        color: "hsl(var(--muted-foreground))",
                        caretColor: "hsl(var(--sage))",
                      }}
                    />
                    <motion.button
                      onClick={handleSend}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!message.trim() || loading}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: message.trim() && !loading ? "pointer" : "not-allowed",
                        fontSize: "9px",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color:
                          message.trim() && !loading
                            ? "hsl(var(--foreground))"
                            : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {loading ? "Sending..." : "Send →"}
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: "center", padding: "16px 0 8px" }}
              >
                <p style={{ fontFamily: "inherit", fontSize: "14px", color: "hsl(var(--foreground))", marginBottom: "4px", marginTop: "40px"  }}>
                  Thanks for the note{name ? `, ${name}` : ""}!
                </p>
        
                <button
                  onClick={handleReset}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "hsl(var(--muted-foreground))",
                    fontFamily: "inherit",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Send another
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Postcard;