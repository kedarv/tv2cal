import React, { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';
import dayjs from 'dayjs';
import ListForm from './ListForm';
import Lists from './Lists';
import EditModal from './EditModal';
import { API_BASE } from './utils';

function App() {
  const [lists, setLists] = useState([]);
  const [editingList, setEditingList] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLists = async () => {
    const resp = await (await fetch(`${API_BASE}/lists`)).json();
    setLists(resp);
  }

  useEffect(() => {
    fetchLists();
  }, [])

  const handleEdit = (e, list) => {
    e.preventDefault();
    console.log(list);
    setEditingList(list);
    setIsModalOpen(true);
  }

  return (
    <>
      <EditModal isOpen={isModalOpen} setIsModalOpen={setIsModalOpen} list={editingList} fetchLists={fetchLists} />
      <ListForm fetchLists={fetchLists} standaloneForm={false} />
      <Lists lists={lists} handleEdit={handleEdit} />
    </>
  );
}

export default App;
