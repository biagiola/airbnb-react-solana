import getCurrentUser from "../actions/getCurrentUser";
import getListings from "../actions/getListings";
import getCurrentUser_ from "../actions/anchor/getCurrentUser";
import getListings_ from "../actions/anchor/getListings";
import ClientOnly from "../components/ClientOnly";
import ListingCard from "../components/listing/ListingCard";
import PriceSwitch from "../components/inputs/PriceSwitch";

export default async function Home({ searchParams }: any) {
  // const [
  //   currentUser,
  //   listings,
  // ] = await Promise.all([
  //   getCurrentUser(),
  //   getListings(searchParams),
  // ]);

  const [
    currentUser,
    listings,
  ] = await Promise.all([
    getCurrentUser(),
    getListings_(searchParams),
  ]);

  return (
    <ClientOnly>
      <main className="pb-20 px-5 phone:px-10 large:px-20">
        <PriceSwitch />
        <div className="grid grid-cols-1 sm:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 2xl:grid-cols-5 largest:grid-cols-6 gap-8">
          {
            listings && listings.length > 0 ? (
              listings.map((listing) => (
                <ListingCard
                  key={listing.id.toString()}
                  data={{
                    ...listing,
                    id: listing.id.toString(),
                  }}
                  currentUser={currentUser}
                />
              ))
            ) : (
              <div>There are no listings yet</div>
            )
          }
        </div>
      </main>
    </ClientOnly>
  );
}
