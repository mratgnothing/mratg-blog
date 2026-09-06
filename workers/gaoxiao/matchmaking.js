// Pure queue transitions. One coordinator per table size; rooms run independently.
export const QUEUE_LEASE_MS = 15000;
export const TICKET_TTL_MS = 6 * 60 * 60 * 1000;
export function joinQueue(queue, player, now) {
  const old = queue.find(t => t.playerId === player.playerId);
  if (old) { old.seenAt = now; return old; }
  const ticket = { ...player, joinedAt: now, seenAt: now, roomId: null };
  queue.push(ticket);
  return ticket;
}
export function cancelQueue(queue, playerId) {
  const ticket = queue.find(t => t.playerId === playerId);
  if (ticket?.roomId) return { roomId: ticket.roomId };
  const index = queue.indexOf(ticket);
  if (index >= 0) queue.splice(index, 1);
  return { cancelled: true };
}
export function advanceQueue(queue, size, now, waitMs, makeId) {
  const retained = queue.filter(t => t.roomId ? now - t.joinedAt < TICKET_TTL_MS : now - t.seenAt < QUEUE_LEASE_MS);
  queue.splice(0, queue.length, ...retained);
  const waiting = queue.filter(t => !t.roomId).sort((a, b) => a.joinedAt - b.joinedAt);
  while (waiting.length && (waiting.length >= size || now >= waiting[0].joinedAt + waitMs)) {
    const members = waiting.splice(0, size);
    const roomId = makeId();
    const roster = members.map(({playerId, name, schoolId}) => ({playerId, name, schoolId}));
    for (const ticket of members) { ticket.roomId = roomId; ticket.roster = roster; }
  }
  return queue;
}
export function queueView(queue, playerId, size, waitMs, now) {
  const ticket = queue.find(t => t.playerId === playerId);
  if (!ticket) return { status: 'expired', message: '匹配已取消或等待连接已中断，请重新匹配。' };
  if (ticket.roomId) return { status: 'matched', roomId: ticket.roomId };
  const waiting = queue.filter(t => !t.roomId).sort((a,b) => a.joinedAt - b.joinedAt);
  const batch = Math.floor(waiting.indexOf(ticket) / size) * size;
  const members = waiting.slice(batch, batch + size);
  return { status: 'waiting', size, humans: members.length, names: members.map(t => t.name),
    deadline: members[0].joinedAt + waitMs, serverNow: now };
}
