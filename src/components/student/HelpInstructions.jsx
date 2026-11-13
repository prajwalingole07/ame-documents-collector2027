import React from 'react';
import { Phone, Mail, HelpCircle, FileText, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

export default function HelpInstructions() {
  const faqs = [
    {
      q: "What format and size should my uploaded documents be?",
      a: "Accepted file formats are PDF, JPG, JPEG, and PNG. We recommend keeping each document around 200 KB to 250 KB (maximum limit is 5 MB). Make sure all text and stamps are crisp and legible."
    },
    {
      q: "Can I save my progress and upload the remaining documents later?",
      a: "Yes! Every document you upload is saved instantly in Cloud Firestore and Storage. You can log out anytime and resume from your phone or PC."
    },
    {
      q: "What is the difference between 'Uploaded' and 'Approved'?",
      a: "'Uploaded' means your document is saved in the system. 'Approved' means the scrutiny officer at Admissions Made Easy, Latur has verified that your certificate is valid, complete, and authentic."
    },
    {
      q: "What happens if a document is rejected?",
      a: "If a document is rejected, you will see a red rejection notice with the exact reason provided by the scrutiny officer under the 'Rejected' tab. You can simply upload a corrected document."
    },
    {
      q: "Who needs to upload Caste Validity and Non-Creamy Layer (NCL)?",
      a: "Caste Validity is compulsory for SC, ST, VJ, NT, OBC, SBC, and SEBC categories. Non-Creamy Layer (valid up to 31/03/2027) is compulsory for VJ, NT, OBC, SBC, and SEBC candidates."
    },
    {
      q: "How do I apply for Government Fee Concession / Scholarship?",
      a: "Check the 'Government Fee Concession' box in the Upload Documents section. You will then be prompted to provide Family Income Certificate (FY 2025-26 / Form 16), Aadhaar linked Bank account, and Ration Card."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Contact Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="bg-yellow-400 text-blue-950 font-bold text-xs uppercase px-3 py-1 rounded-full">
              Student Helpdesk
            </span>
            <h2 className="text-xl font-bold mt-2">ADMISSIONS MADE EASY, LATUR</h2>
            <p className="text-sm text-blue-200 mt-1">
              Have doubts regarding document format, category validity, or CAP round scrutiny?
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="tel:9422611661"
              className="flex items-center gap-2 bg-white text-blue-900 px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-blue-50 transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-700" /> 94226 11661
            </a>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600" /> Simple 4-Step Document Submission Process
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mb-3">1</span>
            <h4 className="font-semibold text-gray-800 text-sm">Review Requirements</h4>
            <p className="text-xs text-gray-500 mt-1">Check your category documents & compulsory photo/signature requirements.</p>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mb-3">2</span>
            <h4 className="font-semibold text-gray-800 text-sm">Scan & Upload</h4>
            <p className="text-xs text-gray-500 mt-1">Upload clear PDF or JPG scans (200–250 KB recommended) from mobile or computer.</p>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mb-3">3</span>
            <h4 className="font-semibold text-gray-800 text-sm">Submit Application</h4>
            <p className="text-xs text-gray-500 mt-1">Once all mandatory items show green checkmarks, click Final Submit Application.</p>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs mb-3">4</span>
            <h4 className="font-semibold text-gray-800 text-sm">Admin Scrutiny</h4>
            <p className="text-xs text-gray-500 mt-1">Admissions Made Easy team verifies your records. Check the portal for live approval status.</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" /> Frequently Asked Questions (FAQ)
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
              <h4 className="font-semibold text-gray-800 text-sm">{faq.q}</h4>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
