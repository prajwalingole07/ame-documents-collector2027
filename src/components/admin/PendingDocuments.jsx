import React from 'react';
import DocumentVerification from './DocumentVerification';

export default function PendingDocuments() {
  return <DocumentVerification onlyPending={true} />;
}
