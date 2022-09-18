import React, { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';
import ListForm from './ListForm';
import Lists from './Lists';
import EditModal from './EditModal';
import DeleteModal from './DeleteModal';
import { API_BASE } from './utils';
import Container from 'react-bootstrap/Container';

function App() {
  const [lists, setLists] = useState([]);
  const [managingList, setManagingList] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchLists = async () => {
    const resp = await (await fetch(`${API_BASE}/lists`)).json();
    setLists(resp);
  };

  useEffect(() => {
    fetchLists();
  }, []);

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
      <ListForm fetchLists={fetchLists} standaloneForm={false} />
      <Lists lists={lists} handleEdit={handleEdit} handleDelete={handleDelete} />
    </Container>
  );
}

export default App;
