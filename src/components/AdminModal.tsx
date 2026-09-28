import React, { useState } from 'react';
import { StaffMember, WinnerRecord, Prize } from '../types';
import { getDefaultStaffList } from '../data/defaultStaff';
import {
  X,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Copy,
  Users,
  Award,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onUpdateStaffList: (newList: StaffMember[]) => void;
  winners: WinnerRecord[];
  onDeleteWinner: (winnerId: string) => void;
  onResetWinners: () => void;
  prizes: Prize[];
  onUpdatePrizes: (newPrizes: Prize[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onUpdateStaffList,
  winners,
  onDeleteWinner,
  onResetWinners,
  prizes,
  onUpdatePrizes,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminId, setAdminId] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Tabs: 'staff' | 'winners' | 'bulk' | 'prizes'
  const [activeTab, setActiveTab] = useState<'staff' | 'winners' | 'bulk' | 'prizes'>('staff');

  // Single staff add
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [staffAddError, setStaffAddError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Toast notification inside Admin Modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom confirmation modal (to completely avoid window.confirm blocking in iframe)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmButtonText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Bulk add
  const [bulkInput, setBulkInput] = useState<string>('');
  const [bulkMessage, setBulkMessage] = useState<string>('');

  // Copy notification
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim() === '0926') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('비밀번호가 올바르지 않습니다. (0926)');
    }
  };

  // Add single staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStaffName.trim();
    if (!trimmed) return;

    if (staffList.some(s => s.name === trimmed)) {
      setStaffAddError(`'${trimmed}' 님은 이미 명단에 등록되어 있습니다.`);
      return;
    }

    setStaffAddError('');
    const newMember: StaffMember = {
      id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
    };

    onUpdateStaffList([...staffList, newMember]);
    setNewStaffName('');
    showToast(`'${trimmed}' 님이 명단에 추가되었습니다.`);
  };

  // Direct delete staff member (completely bypasses window.confirm to guarantee immediate execution)
  const handleDeleteStaff = (id: string, name: string) => {
    onUpdateStaffList(staffList.filter(s => s.id !== id));
    showToast(`'${name}' 님이 명단에서 삭제되었습니다.`);
  };

  // Save inline edit
  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    onUpdateStaffList(
      staffList.map(s => (s.id === id ? { ...s, name: trimmed } : s))
    );
    showToast(`'${trimmed}'(으)로 수정되었습니다.`);
    setEditingId(null);
    setEditingName('');
  };

  // Bulk import
  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;

    // Split by newlines, commas, or spaces
    const rawNames = bulkInput
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const existingNames = new Set(staffList.map(s => s.name));
    const addedMembers: StaffMember[] = [];
    let duplicateCount = 0;

    rawNames.forEach((name, idx) => {
      if (existingNames.has(name)) {
        duplicateCount++;
      } else {
        existingNames.add(name);
        addedMembers.push({
          id: `staff-bulk-${Date.now()}-${idx}`,
          name,
        });
      }
    });

    onUpdateStaffList([...staffList, ...addedMembers]);
    setBulkMessage(
      `총 ${addedMembers.length}명이 추가되었습니다.${
        duplicateCount > 0 ? ` (중복 ${duplicateCount}명 제외)` : ''
      }`
    );
    setBulkInput('');
    showToast(`명단 ${addedMembers.length}명 일괄 등록 완료`);
  };

  // Reset to default 90 staff via custom React dialog
  const handleResetToDefault = () => {
    setConfirmDialog({
      title: '초기 90명 명단 복구',
      message: '수원시장애인종합복지관 90명 초기 직원 명단으로 되돌리시겠습니까? 현재 입력된 명단이 초기화됩니다.',
      confirmButtonText: '90명 명단 복구',
      onConfirm: () => {
        onUpdateStaffList(getDefaultStaffList());
        setConfirmDialog(null);
        showToast('초기 90명 명단으로 복구되었습니다.');
      },
    });
  };

  // Reset winners via custom React dialog
  const handleResetWinnersConfirm = () => {
    setConfirmDialog({
      title: '당첨 내역 초기화',
      message: '모든 당첨 이력을 초기화하시겠습니까? 당첨된 분들도 다시 추첨 대상에 포함됩니다.',
      confirmButtonText: '당첨 초기화',
      onConfirm: () => {
        onResetWinners();
        setConfirmDialog(null);
        showToast('모든 당첨 내역이 초기화되었습니다.');
      },
    });
  };

  // Delete single winner
  const handleDeleteWinnerDirect = (winnerId: string, name: string) => {
    onDeleteWinner(winnerId);
    showToast(`'${name}' 님의 당첨이 취소되었습니다.`);
  };

  // Copy winners to clipboard
  const handleCopyWinners = () => {
    if (winners.length === 0) return;
    const text = winners
      .map((w, idx) => `${idx + 1}. [${w.prizeName}] ${w.name}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    showToast('당첨자 명단이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  // Filter staff by search query
  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">관리자 모드 (Admin)</h2>
              <p className="text-xs text-amber-200">
                직원 명단 및 추첨 설정 관리
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast Notification Inside Modal */}
        {toastMessage && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between shadow-inner animate-fade-in z-20">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-amber-200 hover:text-white text-xs"
            >
              닫기
            </button>
          </div>
        )}

        {/* Content: Auth Form or Admin Panel */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              관리자 인증
            </h3>
            <p className="text-sm text-slate-500 mb-6 text-center">
              직원 명단 수정 및 추첨 설정을 위해 관리자 로그인이 필요합니다.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  아이디 (Admin ID)
                </label>
                <input
                  type="text"
                  value={adminId}
                  onChange={e => setAdminId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  비밀번호 (Password: 0926)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                관리자 로그인
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50 gap-2 pt-2">
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'staff'
                    ? 'border-amber-500 text-amber-800 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                직원 명단 ({staffList.length}명)
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'bulk'
                    ? 'border-amber-500 text-amber-800 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                일괄 등록 (붙여넣기)
              </button>
              <button
                onClick={() => setActiveTab('winners')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'winners'
                    ? 'border-amber-500 text-amber-800 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" />
                당첨자 내역 ({winners.length}명)
              </button>
              <button
                onClick={() => setActiveTab('prizes')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  activeTab === 'prizes'
                    ? 'border-amber-500 text-amber-800 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                경품 설정
              </button>
            </div>

            {/* Tab 1: Staff Member List & Single Add */}
            {activeTab === 'staff' && (
              <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
                {/* Add new staff bar */}
                <form
                  onSubmit={handleAddStaff}
                  className="flex items-center gap-2 bg-amber-50/80 p-3 rounded-2xl border border-amber-200"
                >
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={e => {
                      setNewStaffName(e.target.value);
                      if (staffAddError) setStaffAddError('');
                    }}
                    placeholder="새 직원 성명 입력 (예: 홍길동)"
                    className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </form>

                {/* Inline error for duplicate staff addition */}
                {staffAddError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{staffAddError}</span>
                  </div>
                )}

                {/* Search & Actions Bar */}
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="성명 검색..."
                    className="w-48 sm:w-64 px-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    초기 90명 명단 복구
                  </button>
                </div>

                {/* Staff List Table */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
                  {filteredStaff.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      등록된 직원이 없습니다.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                      {filteredStaff.map((staff, idx) => {
                        const isWon = winners.some(w => w.staffId === staff.id || w.name === staff.name);
                        return (
                          <div
                            key={staff.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isWon
                                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                                : 'bg-slate-50/90 border-slate-200 text-slate-800 hover:bg-white hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs text-slate-400 font-mono w-6">
                                {idx + 1}
                              </span>
                              {editingId === staff.id ? (
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={e => setEditingName(e.target.value)}
                                  className="w-24 px-2 py-0.5 text-sm bg-white border border-amber-500 rounded focus:outline-none"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveEdit(staff.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-sm truncate">
                                  {staff.name}
                                </span>
                              )}
                              {isWon && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 shrink-0">
                                  당첨완료
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {editingId === staff.id ? (
                                <button
                                  onClick={() => handleSaveEdit(staff.id)}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                  title="저장"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingId(staff.id);
                                    setEditingName(staff.name);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                  title="수정"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Direct deletion on click with instant execution & toast notification */}
                              <button
                                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Bulk Import */}
            {activeTab === 'bulk' && (
              <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <p className="font-bold text-amber-950 mb-1">
                    📋 명단 일괄 붙여넣기 안내
                  </p>
                  엑셀(Excel) 또는 한글/메모장에서 복사한 직원 성명을 아래 텍스트 상자에 그대로 붙여넣기 하세요. 줄바꿈이나 쉼표(,)로 구분되어 자동으로 등록됩니다. (동명이인은 없으므로 성명만 입력하시면 됩니다)
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea
                    rows={8}
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder="예시:&#10;정휘명&#10;김민수&#10;이서연&#10;박도윤"
                    className="w-full flex-1 p-4 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono leading-relaxed"
                  />
                </div>

                {bulkMessage && (
                  <div className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    {bulkMessage}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleBulkImport}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
                  >
                    일괄 등록 적용
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Winners Record */}
            {activeTab === 'winners' && (
              <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    현재까지 당첨자: {winners.length}명
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyWinners}
                      disabled={winners.length === 0}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedNotice ? '복사 완료!' : '명단 복사'}
                    </button>
                    <button
                      onClick={handleResetWinnersConfirm}
                      disabled={winners.length === 0}
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      당첨 내역 초기화
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
                  {winners.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                      아직 당첨자가 없습니다.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {winners.map((winner, idx) => (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 font-mono text-xs text-slate-400">
                              #{idx + 1}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                              {winner.prizeName}
                            </span>
                            <span className="font-extrabold text-base text-slate-900">
                              {winner.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {winner.drawnAt}
                            </span>
                          </div>
                          {/* Direct winner cancel without window.confirm */}
                          <button
                            onClick={() => handleDeleteWinnerDirect(winner.id, winner.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="당첨 취소"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Prizes Settings */}
            {activeTab === 'prizes' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <p className="font-bold text-amber-950 mb-1">
                    🎁 경품 및 인원수 설정
                  </p>
                  기본 설정: 커피 티백 5명, 화장품세트 20명으로 구성되어 있습니다. 필요 시 각 경품의 추첨 인원수를 조정할 수 있습니다.
                </div>

                <div className="space-y-3">
                  {prizes.map((prize, idx) => (
                    <div
                      key={prize.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">
                            {prize.name}
                          </h4>
                          <span className="text-xs text-slate-500">
                            현재 추첨 인원: {prize.count}명
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600">
                          인원수:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={prize.count}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            onUpdatePrizes(
                              prizes.map(p =>
                                p.id === prize.id ? { ...p, count: val } : p
                              )
                            );
                          }}
                          className="w-16 px-2.5 py-1.5 text-center font-bold border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-xs text-slate-500">명</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Confirmation Modal (Runs inside React, never blocked by browser) */}
        {confirmDialog && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                {confirmDialog.title}
              </h4>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm"
                >
                  {confirmDialog.confirmButtonText || '확인'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
