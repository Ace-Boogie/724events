import { fireEvent, render, screen } from "@testing-library/react";
import { api, DataProvider } from "../../contexts/DataContext";
import Events from "./index";

const data = {
  events: [
    {
      id: 1,
      type: "soirée entreprise",
      date: "2022-04-29T20:28:45.744Z",
      title: "Conférence #productCON",
      cover: "/images/stem-list-EVgsAbL51Rk-unsplash.png",
      description:
          "Présentation des outils analytics aux professionnels du secteur",
      nb_guesses: 1300,
      periode: "24-25-26 Février",
      prestations: [
        "1 espace d’exposition",
        "1 scéne principale",
        "2 espaces de restaurations",
        "1 site web dédié",
      ],
    },

    {
      id: 2,
      type: "forum",
      date: "2022-04-29T20:28:45.744Z",
      title: "Forum #productCON",
      cover: "/images/stem-list-EVgsAbL51Rk-unsplash.png",
      description:
          "Présentation des outils analytics aux professionnels du secteur",
      nb_guesses: 1300,
      periode: "24-25-26 Février",
      prestations: ["1 espace d’exposition", "1 scéne principale"],
    },
  ],
};

// 20 événements de la même catégorie -> 3 pages avec PER_PAGE = 9.
// Le mock principal n'en contient que 2, soit moins d'une page : aucun de ses
// tests ne peut détecter un bug de pagination.
const manyEvents = {
  events: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    type: "forum",
    date: "2022-04-29T20:28:45.744Z",
    title: `Événement ${i + 1}`,
    cover: "/images/stem-list-EVgsAbL51Rk-unsplash.png",
    description: "Description",
    nb_guesses: 100,
    periode: "24-25-26 Février",
    prestations: ["1 espace"],
  })),
};

describe("When Events is created", () => {
  it("a list of event card is displayed", async () => {
    api.loadData = jest.fn().mockReturnValue(data);
    render(
        <DataProvider>
          <Events />
        </DataProvider>
    );
    // CORRECTION : "avril" apparaît sur les deux cartes -> findByText échouait.
    // On vérifie plutôt que chaque événement du mock est bien rendu.
    expect(await screen.findByText("Conférence #productCON")).toBeInTheDocument();
    expect(screen.getByText("Forum #productCON")).toBeInTheDocument();
    expect(screen.getAllByTestId("card-testid")).toHaveLength(data.events.length);
  });
  describe("and an error occured", () => {
    it("an error message is displayed", async () => {
      // CORRECTION : mockRejectedValue() rejetait avec "undefined",
      // donc error restait falsy et le message n'était jamais affiché.
      api.loadData = jest.fn().mockRejectedValue(new Error("fetch failed"));
      render(
          <DataProvider>
            <Events />
          </DataProvider>
      );
      expect(await screen.findByText("An error occured")).toBeInTheDocument();
    });
  });
  describe("and we select a category", () => {
    it("an filtered list is displayed", async () => {
      api.loadData = jest.fn().mockReturnValue(data);
      render(
          <DataProvider>
            <Events />
          </DataProvider>
      );
      await screen.findByText("Forum #productCON");
      fireEvent(
          await screen.findByTestId("collapse-button-testid"),
          new MouseEvent("click", {
            cancelable: true,
            bubbles: true,
          })
      );
      fireEvent(
          (await screen.findAllByText("soirée entreprise"))[0],
          new MouseEvent("click", {
            cancelable: true,
            bubbles: true,
          })
      );

      await screen.findByText("Conférence #productCON");
      expect(screen.queryByText("Forum #productCON")).not.toBeInTheDocument();
    });
  });

  describe("and we click on an event", () => {
    it("the event detail is displayed", async () => {
      api.loadData = jest.fn().mockReturnValue(data);
      render(
          <DataProvider>
            <Events />
          </DataProvider>
      );

      fireEvent(
          await screen.findByText("Conférence #productCON"),
          new MouseEvent("click", {
            cancelable: true,
            bubbles: true,
          })
      );

      await screen.findByText("24-25-26 Février");
      await screen.findByText("1 site web dédié");
    });
  });

  describe("and there are more events than one page", () => {
    it("displays as many page links as needed", async () => {
      api.loadData = jest.fn().mockResolvedValue(manyEvents);
      const { container } = render(
          <DataProvider>
            <Events />
          </DataProvider>
      );

      await screen.findByText("Événement 1");

      // 20 événements / 9 par page = 3 pages
      const pageLinks = container.querySelectorAll(".Pagination a");
      expect(pageLinks).toHaveLength(3);
      expect(pageLinks[0]).toHaveTextContent("1");
      expect(pageLinks[2]).toHaveTextContent("3");
    });

    it("displays at most PER_PAGE cards on the first page", async () => {
      api.loadData = jest.fn().mockResolvedValue(manyEvents);
      render(
          <DataProvider>
            <Events />
          </DataProvider>
      );

      await screen.findByText("Événement 1");

      expect(screen.getAllByTestId("card-testid")).toHaveLength(9);
      expect(screen.queryByText("Événement 10")).not.toBeInTheDocument();
    });

    it("shows the remaining events when the last page is selected", async () => {
      api.loadData = jest.fn().mockResolvedValue(manyEvents);
      const { container } = render(
          <DataProvider>
            <Events />
          </DataProvider>
      );

      await screen.findByText("Événement 1");

      const pageLinks = container.querySelectorAll(".Pagination a");
      fireEvent(
          pageLinks[2],
          new MouseEvent("click", { cancelable: true, bubbles: true })
      );

      // Page 3 : les événements 19 et 20 uniquement
      await screen.findByText("Événement 19");
      expect(screen.getByText("Événement 20")).toBeInTheDocument();
      expect(screen.queryByText("Événement 1")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("card-testid")).toHaveLength(2);
    });
  });
});