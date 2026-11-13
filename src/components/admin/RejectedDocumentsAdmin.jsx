import React from 'react';
import DocumentVerification from './DocumentVerification';

export default function RejectedDocumentsAdmin() {
  return <DocumentVerification onlyRejected={true} />;
}
