import React, { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';
import ListForm from './ListForm';
import Lists from './Lists';
import EditModal from './EditModal';
import DeleteModal from './DeleteModal';
import LoginForm from './LoginForm';
import { API_BASE } from './utils';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useAuth } from './AuthProvider';
import { Toaster } from 'react-hot-toast';

function App() {
  const { email } = useAuth();
  const [lists, setLists] = useState({
    unauthedLists: [],
    authedLists: []
  });
  const [managingList, setManagingList] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchLists = async (email) => {
    const resp = await (await fetch(`${API_BASE}/lists?email=${encodeURIComponent(email)}`)).json();
    setLists(resp);
  };

  useEffect(() => {
    fetchLists(email);
  }, [email]);

  const handleEdit = (e, list) => {
    e.preventDefault();
    setManagingList(list);
    setIsEditModalOpen(true);
  };

  const handleDelete = (e, list) => {
    e.preventDefault();
    setManagingList(list);
    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <Toaster position="top-right" />
      <Container className="mb-3">
        <EditModal
          isOpen={isEditModalOpen}
          setIsModalOpen={setIsEditModalOpen}
          list={managingList}
          fetchLists={fetchLists}
        />
        <DeleteModal
          isOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          list={managingList}
          fetchLists={fetchLists}
        />
        <Container fluid className="mt-3">
          <Row>
            <Col md={{ span: 4, offset: 4 }}>
              <h1 className="h4">
                tv2cal&nbsp;<small className="text-muted">track your shows in your calendar</small>
              </h1>
            </Col>
          </Row>
        </Container>
        {!email && <LoginForm />}
        {email && !lists['authedLists'] && (
          <ListForm fetchLists={fetchLists} standaloneForm={false} />
        )}
        <Lists lists={lists} handleEdit={handleEdit} handleDelete={handleDelete} />
      </Container>
    </>
  );
}

export default App;
