import { BOARD_LAYOUT } from './boardLayout'

// Converts camera pixel coordinates to normal coordinates, uses Newton's method
export function cameraToBoard(camX, camY, corners) {
  const [tl, tr, bl, br] = corners

  // Start with Newton's method from the center of the quad
  let u = 0.5, v = 0.5

  for (let i = 0; i < 20; i++) {

    // Given the guess, compute where it lands in the camera pixel
    const px = (1-u)*(1-v)*tl.x + u*(1-v)*tr.x + (1-u)*v*bl.x + u*v*br.x
    const py = (1-u)*(1-v)*tl.y + u*(1-v)*tr.y + (1-u)*v*bl.y + u*v*br.y

    // Partial derivative of P with respect to u and v (jacobian column)
    const dpu_x = -(1-v)*tl.x + (1-v)*tr.x - v*bl.x + v*br.x
    const dpu_y = -(1-v)*tl.y + (1-v)*tr.y - v*bl.y + v*br.y
    const dpv_x = -(1-u)*tl.x - u*tr.x + (1-u)*bl.x + u*br.x
    const dpv_y = -(1-u)*tl.y - u*tr.y + (1-u)*bl.y + u*br.y

    // Determinant of the 2x2 Jacobian 
    const det = dpu_x*dpv_y - dpu_y*dpv_x
    if (Math.abs(det) < 1e-10) break

    // Adjusting the guesses based on how far off (px, py) is from (camX, camY)
    u += (dpv_y*(camX-px) - dpv_x*(camY-py)) / det
    v += (-dpu_y*(camX-px) + dpu_x*(camY-py)) / det

    // Keeping u and v within the board range 
    u = Math.max(0, Math.min(1, u))
    v = Math.max(0, Math.min(1, v))
  }

  return { boardX: u, boardY: v }
}

export function getKey(boardX, boardY) {
  // Takes a board position and returns what the cell is
  // EX. if the board is 8x8 and the (baordX, boardY) states (0.75, 0.25),
  // it returns whatever it is in column 6, row 2 of the BOARD_LAYOUT.
  const rows = BOARD_LAYOUT.length
  const cols = BOARD_LAYOUT[0].length

  // Converts the 0 to 1 postiion to row and col index
  const col = Math.floor(boardX * cols)
  const row = Math.floor(boardY * rows)

  // Securing it so it never goes out of bounds
  const r = Math.max(0, Math.min(rows - 1, row))
  const c = Math.max(0, Math.min(cols - 1, col))
  return BOARD_LAYOUT[r][c]
}
