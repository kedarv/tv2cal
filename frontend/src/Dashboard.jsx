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
import Button from 'react-bootstrap/Button';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import styles from './Dashboard.css';

function Dashboard({ lists }) {
  const { email } = useAuth();
  const [episodes, setEpisodes] = useState([]);
  const [watched, setWatched] = useState(null);
  const [shows, setShows] = useState([]);

  const fetchEpisodes = async () => {
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

  const handleMarkAllAsWatched = async (showId) => {
    let resp;
    resp = await fetch(`${API_BASE}/markAllAsWatched`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, showId })
    });
    if (resp.status === 200) {
      const updatedWatched = await resp.json();
      setWatched(updatedWatched);
      toast.success(`Marked all as watched`);
    } else {
      toast.error(`Something went wrong: ${(await resp.json())['message']}`);
    }
  };

  useEffect(() => {
    fetchEpisodes();
  }, [lists]);

  useEffect(() => {
    let shows = [];
    if (watched) {
      lists.forEach((list) => {
        const sorted = JSON.parse(list['shows']).sort(
          (showA, showB) => unwatchedCountByShow(showB['id']) - unwatchedCountByShow(showA['id'])
        );
        shows = shows.concat(sorted);
      });
      setShows(shows);
    }
  }, [episodes]);

  const onCheckboxChange = async (episodeId, event) => {
    let resp;
    resp = await fetch(`${API_BASE}/markAsWatched`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, episodeId })
    });
    if (resp.status === 200) {
      const updatedWatched = await resp.json();
      setWatched(updatedWatched);
      toast.success(`Marked as ${!event.target.checked ? 'watched' : 'unwatched'}`);
    } else {
      toast.error(`Something went wrong: ${(await resp.json())['message']}`);
    }
  };

  return (
    <>
      <Card className="mt-2" style={{ border: 'none' }}>
        {
          <Accordion>
            {shows.map((show) => {
              const episodesForShow = episodesByShow(show['id']);
              const watchedEpisodesForShow = watchedEpisodesByShow(show['id']);
              const unwatchedCount = episodesForShow.length - watchedEpisodesForShow.length;
              return (
                <Accordion.Item eventKey={show['id']} key={show['id']}>
                  <Accordion.Header>
                    <Container style={{ paddingLeft: 0 }} key={`container-${show['id']}`}>
                      <Row>
                        <Col md={10}>{show['label']}</Col>
                        {unwatchedCount > 0 && (
                          <Col className='text-justify-lg'>
                            <Badge bg="light" text={'dark'}>
                              {unwatchedCount} episode{unwatchedCount > 1 ? 's' : ''}
                            </Badge>
                          </Col>
                        )}
                      </Row>
                    </Container>
                  </Accordion.Header>
                  <Accordion.Body>
                    <ListGroup>
                      {!!unwatchedCount && (
                        <Container style={{ padding: 0 }} className="mb-2">
                          <Button
                            variant="dark"
                            align="left"
                            onClick={() => handleMarkAllAsWatched(show['id'])}
                          >
                            Mark all as Watched
                          </Button>
                        </Container>
                      )}
                      {episodesForShow
                        .sort(
                          (
                            episodeA,
                            episodeB // Sort by watched status, season, then episode
                          ) =>
                            episodeA.WatchedEpisodes.length - episodeB.WatchedEpisodes.length ||
                            episodeA.season_number - episodeB.season_number ||
                            episodeA.episode_number - episodeB.episode_number
                        )
                        .map((episode) => (
                          <React.Fragment key={`wrapper-${episode.episode_id}`}>
                            <ListGroup.Item as="li">
                              <Form.Check
                                type="checkbox"
                                checked={
                                  watched.filter(
                                    (watchedEpisode) =>
                                      watchedEpisode.episodeId == episode.episode_id
                                  ).length
                                }
                                id={`check-${episode.episode_id}`}
                                label={
                                  <div className="ms-2 me-auto">
                                    <div className="fw-bold">
                                      {' '}
                                      s{episode.season_number}e{episode.episode_number}
                                    </div>
                                    {episode.name}
                                  </div>
                                }
                                onChange={(event) => onCheckboxChange(episode.episode_id, event)}
                              />
                            </ListGroup.Item>
                          </React.Fragment>
                        ))}
                    </ListGroup>
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>
        }
      </Card>
    </>
  );
}

export default Dashboard;
