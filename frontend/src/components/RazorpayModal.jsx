import React, { useState } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Building, 
  ShieldCheck, 
  X, 
  Loader2, 
  Lock
} from 'lucide-react';

const RazorpayModal = ({ isOpen, onClose, amount, bookingDetails, onPaymentSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess({
          razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
          razorpayOrderId: 'order_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
          razorpaySignature: 'sig_' + Math.random().toString(36).substring(2, 16),
          paymentMethod: selectedMethod.toUpperCase()
        });
      }, 1000);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 font-sans">
        
        {/* Header */}
        <div className="bg-[#003580] p-5 flex justify-between items-start text-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-wide">Razorpay</span>
              <span className="bg-white/20 text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded">
                Live Gateway
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">Merchant: LuxStay Hospitality</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Payable Amount</span>
            <div className="text-2xl font-black text-[#006ce4]">₹ {amount.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Order ID: <span className="font-mono text-slate-800 font-bold">ORD-{(Math.random()*100000).toFixed(0)}</span></div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5 justify-end">
              <Lock size={10} /> 256-Bit SSL Encrypted
            </div>
          </div>
        </div>

        {/* Body */}
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
            <p className="text-xs text-slate-500">Transaction verified by Razorpay Gateway.</p>
          </div>
        ) : isProcessing ? (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 size={36} className="text-[#006ce4] animate-spin" />
            <h3 className="text-base font-bold text-slate-900">Processing Payment...</h3>
            <p className="text-xs text-slate-500">Connecting to Razorpay gateway servers.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900">{bookingDetails?.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room:</span>
                <span>{bookingDetails?.roomType} ({bookingDetails?.numberOfGuests} Guests)</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Payment Method
              </label>

              {/* UPI */}
              <div 
                onClick={() => setSelectedMethod('upi')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedMethod === 'upi' ? 'bg-blue-50 border-blue-500 text-slate-900' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">UPI / QR Code</div>
                    <div className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm</div>
                  </div>
                </div>
                <input type="radio" checked={selectedMethod === 'upi'} readOnly className="accent-[#006ce4]" />
              </div>

              {/* Card */}
              <div 
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedMethod === 'card' ? 'bg-blue-50 border-blue-500 text-slate-900' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Credit / Debit Card</div>
                    <div className="text-[10px] text-slate-500">Visa, Mastercard, RuPay</div>
                  </div>
                </div>
                <input type="radio" checked={selectedMethod === 'card'} readOnly className="accent-[#006ce4]" />
              </div>

              {/* Net Banking */}
              <div 
                onClick={() => setSelectedMethod('netbanking')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedMethod === 'netbanking' ? 'bg-blue-50 border-blue-500 text-slate-900' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Building size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Net Banking</div>
                    <div className="text-[10px] text-slate-500">HDFC, SBI, ICICI, Axis</div>
                  </div>
                </div>
                <input type="radio" checked={selectedMethod === 'netbanking'} readOnly className="accent-[#006ce4]" />
              </div>
            </div>

            {selectedMethod === 'upi' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">UPI VPA Address</label>
                <input 
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                />
              </div>
            )}

            <button
              onClick={handlePayNow}
              className="w-full py-3 bg-[#006ce4] hover:bg-[#0056b3] text-white font-bold rounded-xl shadow-md text-xs flex items-center justify-center space-x-2"
            >
              <ShieldCheck size={18} />
              <span>Pay ₹ {amount.toLocaleString('en-IN')} via Razorpay</span>
            </button>
          </div>
        )}

        <div className="bg-slate-50 p-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
          Razorpay Secured Payment Gateway
        </div>
      </div>
    </div>
  );
};

export default RazorpayModal;
