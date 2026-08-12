import { useEffect, useState, Fragment } from "react";
import { useData } from "../../contexts/DataContext";
import { getMonth } from "../../helpers/Date";

import "./style.scss";

const Slider = () => {
  const { data } = useData();
  const [index, setIndex] = useState(0);
  const byDateDesc =
      data?.focus
          ?.slice()
          .sort((evtA, evtB) => new Date(evtB.date) - new Date(evtA.date)) ?? [];

  useEffect(() => {
    if (byDateDesc.length === 0) return undefined;
    const timer = setTimeout(() => {
      setIndex(index < byDateDesc.length - 1 ? index + 1 : 0);
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, byDateDesc.length]);
  return (
      <div className="SlideCardList">
        {byDateDesc.map((event, idx) => (
            <Fragment key={event.title}>
              <div
                  className={`SlideCard SlideCard--${index === idx ? "display" : "hide"}`}
              >
                <img src={event.cover} alt={event.title} />
                <div className="SlideCard__descriptionContainer">
                  <div className="SlideCard__description">
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <div>{getMonth(new Date(event.date))}</div>
                  </div>
                </div>
              </div>
            </Fragment>
        ))}

        <div className="SlideCard__paginationContainer">
          <div className="SlideCard__pagination">
            {byDateDesc.map((event, radioIdx) => (
                <input
                    key={`radio-${event.title}`}
                    type="radio"
                    name="radio-button"
                    checked={index === radioIdx}
                    readOnly
                />
            ))}
          </div>
        </div>
      </div>
  );
};

export default Slider;
