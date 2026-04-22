import { BOARD_LAYOUT } from './boardLayout'

export function cameraToBoard(camX, camY, corners) {
  const [tl, tr, bl, br] = corners
  let u = 0.5, v = 0.5

  for (let i = 0; i < 20; i++) {
    const px = (1-u)*(1-v)*tl.x + u*(1-v)*tr.x + (1-u)*v*bl.x + u*v*br.x
    const py = (1-u)*(1-v)*tl.y + u*(1-v)*tr.y + (1-u)*v*bl.y + u*v*br.y
    const dpu_x = -(1-v)*tl.x + (1-v)*tr.x - v*bl.x + v*br.x
    const dpu_y = -(1-v)*tl.y + (1-v)*tr.y - v*bl.y + v*br.y
    const dpv_x = -(1-u)*tl.x - u*tr.x + (1-u)*bl.x + u*br.x
    const dpv_y = -(1-u)*tl.y - u*tr.y + (1-u)*bl.y + u*br.y
    const det = dpu_x*dpv_y - dpu_y*dpv_x
    if (Math.abs(det) < 1e-10) break
    u += (dpv_y*(camX-px) - dpv_x*(camY-py)) / det
    v += (-dpu_y*(camX-px) + dpu_x*(camY-py)) / det
    u = Math.max(0, Math.min(1, u))
    v = Math.max(0, Math.min(1, v))
  }

  return { boardX: u, boardY: v }
}

export function getKey(boardX, boardY) {
  const rows = BOARD_LAYOUT.length
  const cols = BOARD_LAYOUT[0].length
  const col = Math.floor(boardX * cols)
  const row = Math.floor(boardY * rows)
  const r = Math.max(0, Math.min(rows - 1, row))
  const c = Math.max(0, Math.min(cols - 1, col))
  return BOARD_LAYOUT[r][c]
}
