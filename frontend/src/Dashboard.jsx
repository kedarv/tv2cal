import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import { API_BASE } from './utils';
import fetch from 'isomorphic-fetch';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useAuth } from './AuthProvider';

function Dashboard({ lists }) {
  const { email } = useAuth();
  const [episodes, setEpisodes] = useState([]);
  const [watched, setWatched] = useState([]);

  const fetchLists = async () => {
    let accumulatedEpisodes = [];
    let accumulatedWatched = [];
    for (const list of lists) {
      const resp = await (await fetch(`${API_BASE}/list/${list['id']}`)).json();
      accumulatedEpisodes = accumulatedEpisodes.concat(resp['events']);
      accumulatedWatched = accumulatedWatched.concat(resp['watched']);
    }
    setEpisodes(accumulatedEpisodes);
    setWatched(accumulatedWatched);
  };

  const episodesByShow = (showId) => {
    return episodes.filter((episode) => episode.show_id == showId);
  };

  const watchedEpisodesByShow = (showId) => {
    const episodesIdsForShow = episodesByShow(showId).map((e) => e.episode_id);
    return watched.filter((e) => episodesIdsForShow.includes(e.episodeId));
  };

  const unwatchedCountByShow = (showId) => {
    return episodesByShow(showId).length - watchedEpisodesByShow(showId).length;
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const onCheckboxChange = async (listId, episodeId) => {
    let resp;
    resp = await fetch(`${API_BASE}/markAsWatched`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, episodeId, listId })
    });
    if (resp.status === 200) {
      const updatedWatched = await resp.json();
      setWatched(updatedWatched);
    } else {
      console.log('ope');
    }
  };

  return (
    <Card className="mt-2">
      <Card.Body>
        <Card.Title>Watch List</Card.Title>
        <Accordion>
          {lists.map((list) => {
            return JSON.parse(list['shows'])
              .sort(
                (showA, showB) =>
                  unwatchedCountByShow(showB['id']) - unwatchedCountByShow(showA['id'])
              )
              .map((show) => {
                const episodesForShow = episodesByShow(show['id']);
                const watchedEpisodesForShow = watchedEpisodesByShow(show['id']);
                const unwatchedCount = episodesForShow.length - watchedEpisodesForShow.length;
                return (
                  <Accordion.Item eventKey={show['id']} key={show['show_id']}>
                    <Accordion.Header>
                      <Container style={{ paddingLeft: 0 }} key={`container-${show['show_id']}`}>
                        <Row>
                          <Col md={10}>{show['label']}</Col>
                          {unwatchedCount > 0 && (
                            <Col>
                              <Badge bg="light" text={'dark'}>
                                {unwatchedCount} episodes
                              </Badge>
                            </Col>
                          )}
                        </Row>
                      </Container>
                    </Accordion.Header>
                    <Accordion.Body>
                      <ListGroup>
                        {episodesForShow
                          .sort(
                            (episodeA, episodeB) =>
                              episodeA.season_number - episodeB.season_number ||
                              episodeA.episode_number - episodeB.episode_number
                          )
                          .map((e) => (
                            <React.Fragment key={`wrapper-${e.episode_id}`}>
                              <ListGroup.Item
                                as="li"
                                className="d-flex justify-content-between align-items-start"
                              >
                                <Form.Check
                                  type="checkbox"
                                  checked={
                                    watched.filter((episode) => episode.episodeId == e.episode_id)
                                      .length
                                  }
                                  id={`check-${e.episode_id}`}
                                  label={
                                    <div className="ms-2 me-auto">
                                      <div className="fw-bold">
                                        {' '}
                                        s{e.season_number}e{e.episode_number}
                                      </div>
                                      {e.name}
                                    </div>
                                  }
                                  onChange={() => onCheckboxChange(list.id, e.episode_id)}
                                />
                              </ListGroup.Item>
                            </React.Fragment>
                          ))}
                      </ListGroup>
                    </Accordion.Body>
                  </Accordion.Item>
                );
              });
          })}
        </Accordion>
      </Card.Body>
    </Card>
  );
}

export default Dashboard;
