import { postgresService } from '../../database/postgres.js';
import { eventColumns, eventGroup, mapEvent } from '../../database/mappers.js';
import { Event } from '../../types/index.js';
import { NotFoundError } from '../../core/errors/index.js';

export class EventService {
  async getAllEvents(): Promise<Event[]> {
    const result = await postgresService.query(`SELECT ${eventColumns} FROM events e
      LEFT JOIN seats s ON s.event_id=e.id ${eventGroup} ORDER BY e.event_date`);
    return result.rows.map(mapEvent);
  }
  async getEventById(id: string): Promise<Event> {
    const result = await postgresService.query(`SELECT ${eventColumns} FROM events e
      LEFT JOIN seats s ON s.event_id=e.id WHERE e.id=$1 ${eventGroup}`, [id]);
    if (!result.rows.length) throw new NotFoundError(`Event '${id}' not found`);
    return mapEvent(result.rows[0]);
  }
}
export const eventService = new EventService();
