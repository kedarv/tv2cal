import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import fetch from 'isomorphic-fetch';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { API_BASE } from './utils';
import toast, { Toaster } from 'react-hot-toast';

function DeleteModal({ list, isOpen, setIsModalOpen, fetchLists }) {
  const [email, setEmail] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);
    let resp;
    resp = await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, id: list['id'] })
    });
    if (resp.status === 200) {
      toast.success(`List deleted`);
      setIsButtonDisabled(false);
      setIsModalOpen(false);
      fetchLists();
    } else {
      setIsButtonDisabled(false);
      toast.error(`Something went wrong: ${(await resp.json())['message']}`);
    }
  };

  return (
    <>
      <Toaster />
      <Modal show={isOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="formListName">
              <Form.Label>Verify Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="mt-3" disabled={isButtonDisabled} variant="danger">
              {isButtonDisabled ? 'Working...' : 'Delete List'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default DeleteModal;
