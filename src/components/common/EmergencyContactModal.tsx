import React, { useState, useMemo, useEffect } from 'react';
import { 
  PhoneCall, 
  X, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  ShieldAlert, 
  Droplets, 
  Compass, 
  HeartPulse,
  Phone,
  Sparkles
} from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../../data/contacts';
import { ContactCategory, EmergencyContact } from '../../types/contact';

interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'th' | 'en';
  defaultCategory?: ContactCategory;
}

export const EmergencyContactModal: React.FC<EmergencyContactModalProps> = ({
  isOpen,
  onClose,
  lang,
  defaultCategory = 'all'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync category if defaultCategory changes
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(defaultCategory);
      setSearchQuery('');
    }
  }, [isOpen, defaultCategory]);

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const categories: { id: ContactCategory; labelTh: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'emergency', labelTh: 'กู้ภัย & ฉุกเฉิน', labelEn: 'Rescue & Emergency', icon: <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> },
    { id: 'water', labelTh: 'หน่วยงานน้ำ & เขื่อน', labelEn: 'Water & Dams', icon: <Droplets className="w-3.5 h-3.5 text-sky-500" /> },
    { id: 'traffic', labelTh: 'เส้นทาง & จราจร', labelEn: 'Routes & Traffic', icon: <Compass className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'health', labelTh: 'การแพทย์ & สุขภาพ', labelEn: 'Medical & Health', icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-500" /> },
  ];

  const filteredContacts = useMemo(() => {
    return EMERGENCY_CONTACTS.filter((contact) => {
      // Category filter
      if (selectedCategory !== 'all' && contact.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = contact.nameTh.toLowerCase().includes(q) || contact.nameEn.toLowerCase().includes(q);
        const matchShort = contact.shortNameTh.toLowerCase().includes(q) || contact.shortNameEn.toLowerCase().includes(q);
        const matchPhone = contact.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')) || contact.phone.includes(q);
        const matchDesc = contact.descriptionTh.toLowerCase().includes(q) || contact.descriptionEn.toLowerCase().includes(q);
        return matchName || matchShort || matchPhone || matchDesc;
      }
      return true;
    }).sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-5 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/25">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {lang === 'th' ? 'ข้อมูลติดต่อหน่วยงานฉุกเฉิน & น้ำท่วม' : 'Emergency & Water Agency Contacts'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'th' 
                  ? 'สายด่วนขอความช่วยเหลือ กู้ภัย และสอบถามสถานการณ์น้ำตลอด 24 ชั่วโมง'
                  : 'Hotlines for disaster rescue, flood assistance, and water telemetry'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหาชื่อหน่วยงาน หรือเบอร์สายด่วน (เช่น 1784, 1460, ปภ.)...' : 'Search agency name or hotline number (e.g. 1784, 1460)...'}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  {cat.icon}
                  <span>{lang === 'th' ? cat.labelTh : cat.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 max-h-[55vh]">
          {filteredContacts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Phone className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-medium">
                {lang === 'th' ? 'ไม่พบข้อมูลหน่วยงานที่ตรงกับคำค้นหา' : 'No contact found matching your search'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-xs text-sky-600 dark:text-cyan-400 hover:underline"
              >
                {lang === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all filters'}
              </button>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isCopied = copiedId === contact.id;
              return (
                <div
                  key={contact.id}
                  className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 hover:border-sky-300 dark:hover:border-sky-500/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {lang === 'th' ? contact.nameTh : contact.nameEn}
                      </h3>
                      {contact.is24Hours && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {lang === 'th' ? '24 ชม.' : '24/7'}
                        </span>
                      )}
                      {(lang === 'th' ? contact.badgeTh : contact.badgeEn) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {lang === 'th' ? contact.badgeTh : contact.badgeEn}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {lang === 'th' ? contact.descriptionTh : contact.descriptionEn}
                    </p>

                    {contact.website && (
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-cyan-400 hover:underline pt-0.5"
                      >
                        <span>{lang === 'th' ? 'เว็บไซต์ทางการ' : 'Official Website'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Right: Actions & Phone */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/50 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Copy Button */}
                    <button
                      onClick={(e) => handleCopyPhone(contact.id, contact.phone, e)}
                      title={lang === 'th' ? 'คัดลอกเบอร์โทร' : 'Copy phone number'}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isCopied
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{lang === 'th' ? 'คัดลอกแล้ว' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="hidden sm:inline">{lang === 'th' ? 'คัดลอก' : 'Copy'}</span>
                        </>
                      )}
                    </button>

                    {/* Direct Call Button */}
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-md shadow-red-500/25 transition-all hover:scale-102 active:scale-98"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {lang === 'th' 
                ? 'ในกรณีฉุกเฉินน้ำท่วมเฉียบพลัน แนะนำโทร 1784 (ปภ.) หรือ 1669 (กู้ชีพ) ทันที'
                : 'For flash flood emergencies, call 1784 (DDPM) or 1669 (EMS) immediately'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-medium ml-auto"
          >
            {lang === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
