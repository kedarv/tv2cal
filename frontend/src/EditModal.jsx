import React from 'react';
import Modal from 'react-bootstrap/Modal';
import ListForm from './ListForm';

function EditModal({ list, isOpen, setIsModalOpen, fetchLists }) {
  return (
    <Modal show={isOpen} onHide={() => setIsModalOpen(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Edit List</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListForm
          standaloneForm={true}
          list={list}
          fetchLists={() => {
            setIsModalOpen(false);
            fetchLists();
          }}
        />
      </Modal.Body>
    </Modal>
  );
}

export default EditModal;
