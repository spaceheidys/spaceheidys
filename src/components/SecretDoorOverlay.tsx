import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SECRET_CODE = "1234";

interface SecretDoorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecretDoorOverlay = ({ isOpen, onClose }: SecretDoorOverlayProps) => {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    if (value === SECRET_CODE) {
      setTimeout(() => {
        onClose();
        navigate("/secret");
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90" />
      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={handleChange}
          className="bg-black border-2 border-white text-white text-center text-sm tracking-[0.3em] font-display outline-none placeholder:text-white/30"
          style={{ width: "240px", height: "56px" }}
          placeholder="ENTER CODE"
        />
      </motion.div>
    </motion.div>
  );
};

export default SecretDoorOverlay;
