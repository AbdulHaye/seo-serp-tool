
import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-container">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Visibility Tool</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" 
                    aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link active" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/competitors">Competitors</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/ranking">Ranking</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/screenshots">Screenshots</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
