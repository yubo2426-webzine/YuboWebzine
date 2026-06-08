import React, { useState } from 'react';
import { Megaphone, Book, FileText, X, Loader2, Paperclip } from 'lucide-react';

// 💡 App.jsx에 있던 KRDSInput을 독립적으로 사용하기 위해 임시로 가져옵니다.
interface KRDSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const KRDSInput: React.FC<KRDSInputProps> = ({ className, ...props }) => (
  <input className={`w-full h-[52px] px-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner ${className}`} {...props} />
);

export interface UploadFormData {
  title: string;
  content: string;
  event_date: string;
  description: string;
  vol: string;
  file?: File | null;
  type: string;
}

interface UniversalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UploadFormData) => void;
  type: 'notice' | 'issue' | 'article' | string;
  isUploading: boolean;
}

const UniversalUploadModal: React.FC<UniversalUploadModalProps> = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });
  const getLabelClass = "block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 ml-1";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'article' && !file) {
        alert("⚠️ PDF 파일을 먼저 첨부해주세요.");
        return;
    }
    onSubmit({...formData, file, type});
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
               {type === 'notice' && <><Megaphone className="text-amber-500" size={28}/> 소식 작성</>}
               {type === 'issue' && <><Book className="text-teal-500" size={28}/> 자료실 발행</>}
               {type === 'article' && <><FileText className="text-sky-500" size={28}/> 자료 등록</>}
            </h2>
            <button type="button" onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="text-slate-500 dark:text-slate-400"/></button>
          </div>
          
          <div className="p-8">
            {isUploading ? (
               <div className="text-center py-12">
                 <Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" size={48}/> 
                 <p className="text-lg font-bold text-slate-600 dark:text-slate-300">서버에 안전하게 저장 중입니다...</p>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="space-y-6">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol)</label><KRDSInput placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  <div><label className={getLabelClass}>제목</label><KRDSInput placeholder="제목을 입력하세요" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/></div>
                  
                  {type === 'notice' && (
                     <>
                        <div><label className={getLabelClass}>상세 내용</label><textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 h-36 resize-none shadow-inner text-slate-800 dark:text-slate-100" placeholder="내용 입력" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required/></div>
                        <div><label className={getLabelClass}>행사 일정 (선택)</label><KRDSInput type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                     </>
                  )}
              
                  {type === 'issue' && <div><label className={getLabelClass}>설명</label><textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-teal-400 h-28 resize-none shadow-inner text-slate-800 dark:text-slate-100" placeholder="설명 입력" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
                  {type === 'article' && (
                     <div>
                        <label className={getLabelClass}>PDF 파일 첨부</label>
                        <label className="mt-1 flex justify-center px-6 pt-8 pb-8 bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] hover:bg-sky-50 dark:hover:bg-slate-800 relative cursor-pointer group transition-colors">
                           <div className="space-y-3 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-500 group-hover:text-sky-500 transition-colors"/>
                              <div className="flex text-base justify-center">
                                 <span className="relative text-sky-600 dark:text-sky-400 font-black hover:text-sky-700">파일 찾아보기</span>
                                 <input type="file" className="sr-only" onChange={e => { if(e.target.files && e.target.files.length > 0) setFile(e.target.files[0]) }} />
                              </div>
                              <p className="text-sm font-medium text-slate-400">{file ? file.name : 'PDF 문서 (50MB 이하 권장)'}</p>
                           </div>
                        </label>
                     </div>
                  )}
  
                  <div className="flex gap-4 pt-4 mt-8">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-lg font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">취소</button>
                    <button type="submit" className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-lg font-black hover:bg-emerald-600 shadow-md transition-colors">등록 완료</button>
                  </div>
               </form>
            )}
         </div>
      </div>
    </div>
  );
};

export default UniversalUploadModal;