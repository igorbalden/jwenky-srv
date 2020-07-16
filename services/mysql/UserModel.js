const pool = require('./pool');

class UserModel {

  /**
   * Find one user by email, return all fields, exclude password
   */
  static findByEmail(emIn) {
    return this.findOne(emIn, 'email');
  }

  
  /**
   * Find one user by id, return all fields, exclude password
   */
  static findById(idIn) {
    return this.findOne(idIn, 'id');
  }


  /**
   * Find one user by uuid, return all fields
   */
  static findActiveByUuid(uuidIn) {
    let sql = `SELECT u.*, r.refresh FROM users u
      JOIN refreshments r ON r.user_id = u.id
      WHERE r.uuid = ? AND u.is_active = 1 LIMIT 1`;
    return new Promise((resolve, reject) => {
      pool.query(sql, uuidIn, (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          if(Object.keys(result)) {
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  
  /**
   * Find one user, return all fields, exclude password
   * Do not accept 'field' value by user input. Sql injection risk.
   */
  static findOne(val, field) {
    let sql = `SELECT id, name, email, is_admin FROM users 
              WHERE ${field} = ? LIMIT 1`;
    return new Promise((resolve, reject) => {
      pool.query(sql, val, (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          if(Object.keys(result)) {
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      });
    });
  }


  /**
   * Find one active user by email, return all fields, exclude password
   */
  static findActiveByEmail(emIn) {
    return this.findOneActive(emIn, 'email');
  }
  

  /**
   * Find one active user, return all fields, exclude password.
   * Do not accept 'field' value by user input. Sql injection risk.
   */
  static findOneActive(val, field) {
    let sql = `SELECT id, name, email, is_admin FROM users 
              WHERE ${field} = ? AND is_active = 1 LIMIT 1`;
    return new Promise((resolve, reject) => {
      pool.query(sql, val, (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          if(Object.keys(result)) {
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      });
    });
  }
  

  /**
   * Find one active user, return all fields, include password
   * Do not accept 'field' value by user input. Sql injection risk.
   */
  static findOneActivePassw(val, field) {
    let sql = `SELECT * FROM users 
      WHERE ${field} = ? AND is_active = 1 LIMIT 1`;
    return new Promise((resolve, reject) => {
      pool.query(sql, val, (err, result) => {
        if (err) reject(new Error("Database error"));
        else {
          if(Object.keys(result)) {
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      });
    });
  }


  /**
   * Save New User
   * First inserted user will be admin
   */
  saveUs() {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO users SET 
        name =?, email =?, is_active = 1,
        is_admin = IF((SELECT COUNT(u1.id) FROM users u1) = 0, 1, 0), 
        password =?, created_at = NOW(), updated_at = NOW()`;
      pool.query(sql, [ this.name, this.email, this.password,], 
      (err, result) => {
        if (err) reject(new Error("Database saving error"));
        else 
          resolve({id: result.insertId, name: this.name, email: this.email});
      });
    });
  }


  /**
   * Update User Password
   */
  updateUsPass() {
    return new Promise((resolve, reject) => {
      let sql = `UPDATE users SET password = ?, updated_at = NOW() 
                WHERE email = ?` ;
      pool.query(sql, [this.password, this.email], 
      (err, result) => {
        if (err) reject(new Error("Database update error"));
        else {
          let sql = "SELECT id FROM users WHERE email = ? LIMIT 1";
          pool.query(sql, [this.email], 
          (err, result_id) => {
            if (err) reject(new Error("Database error"));
            else {
              return resolve(result_id[0]);
            }
          })
        }
      });
    });
  }


  /**
   * Toggle active field
   */
  static toggleActiveField(uid, state) {
    return new Promise((resolve, reject) => {
      let st = (state === 'on') ? 1 : 0;
      const sql = `UPDATE users SET is_active = ? WHERE id= ?`;
      pool.query(sql, [st, uid],
        (err, actResult) => {
          if (err) return reject(err); 
          else return resolve(actResult);
        }
      );
    });
  }


  /**
   * Save User refresh field
   */
  static saveRefresh(refrToken, id, uuid) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO refreshments SET 
        user_id = ?, uuid = ?, refresh = ?, created_at = NOW()`;
      pool.query(sql, [id, uuid, refrToken], 
      (err, result) => {
        if (err) reject(new Error("Database insert error"));
        else resolve(result);
      });
    });
  }


  /**
   * Delete user current refresh token
   */
  static deleteRefresh(uuid) {
    return new Promise((resolve, reject) => {
      let sql = `DELETE FROM refreshments WHERE uuid = ?`;
      pool.query(sql, [uuid],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }


  /**
   * Delete all user refresh tokens
   */
  static deleteRefreshAll(usIn) {
    return new Promise((resolve, reject) => {
      let sql = `DELETE FROM refreshments WHERE user_id = ?`;
      pool.query(sql, [usIn],
      (err, result) => {
        if (err) return reject(err);
        else return resolve(result);
      });
    });
  }

}

module.exports = UserModel;
